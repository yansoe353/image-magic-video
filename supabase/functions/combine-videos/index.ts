
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import * as FFmpeg from 'https://esm.sh/@ffmpeg/ffmpeg@0.12.7';
import { fetchFile } from 'https://esm.sh/@ffmpeg/util@0.12.1';

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const processErrorResponse = (error: unknown) => {
  console.error("Error processing:", error);
  return new Response(
    JSON.stringify({ error: "Failed to process videos" }),
    { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { videoUrls, audioUrl, userId } = await req.json();
    
    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid video URLs provided" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Processing ${videoUrls.length} videos for user ${userId}`);
    
    // If only one video, return it directly
    if (videoUrls.length === 1) {
      return new Response(
        JSON.stringify({ 
          combinedVideoUrl: videoUrls[0],
          message: "Single video processed successfully."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // For multiple videos, perform actual video processing
    console.log("Starting actual FFmpeg video processing...");
    
    try {
      // Initialize FFmpeg
      const ffmpeg = await FFmpeg.createFFmpeg({ 
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js',
      });
      
      await ffmpeg.load();
      console.log("FFmpeg loaded");
      
      // Download and load each video into FFmpeg
      for (let i = 0; i < videoUrls.length; i++) {
        const videoResponse = await fetch(videoUrls[i]);
        const videoData = await videoResponse.arrayBuffer();
        ffmpeg.writeFile(`input${i}.mp4`, new Uint8Array(videoData));
        console.log(`Loaded video ${i}`);
      }
      
      // Create file list for concatenation
      let fileList = '';
      for (let i = 0; i < videoUrls.length; i++) {
        fileList += `file input${i}.mp4\n`;
      }
      ffmpeg.writeFile('filelist.txt', fileList);
      
      // Execute concatenation command
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'filelist.txt',
        '-c', 'copy',
        'output.mp4'
      ]);
      
      console.log("Concatenation completed");
      
      // Add audio if provided
      if (audioUrl) {
        const audioResponse = await fetch(audioUrl);
        const audioData = await audioResponse.arrayBuffer();
        ffmpeg.writeFile('audio.mp3', new Uint8Array(audioData));
        
        await ffmpeg.exec([
          '-i', 'output.mp4',
          '-i', 'audio.mp3',
          '-map', '0:v',
          '-map', '1:a',
          '-shortest',
          'final.mp4'
        ]);
        console.log("Audio added");
      } else {
        await ffmpeg.exec([
          '-i', 'output.mp4',
          '-c', 'copy',
          'final.mp4'
        ]);
      }
      
      // Read the output file
      const outputData = ffmpeg.readFile('final.mp4');
      
      // Create an object URL from the data
      const blob = new Blob([outputData], { type: 'video/mp4' });
      
      // Store the processed video in Supabase Storage
      // First, check if we have a 'videos' bucket, create it if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const videoBucket = buckets?.find(b => b.name === 'videos');
      
      if (!videoBucket) {
        await supabase.storage.createBucket('videos', {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024 // 100MB
        });
        console.log("Created 'videos' bucket");
      }
      
      // Generate a unique filename
      const filename = `${userId}_${Date.now()}.mp4`;
      
      // Upload the processed video
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filename, blob, {
          contentType: 'video/mp4',
          upsert: true
        });
        
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      // Get the public URL for the uploaded video
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filename);
      
      const processedUrl = publicUrlData.publicUrl;
      console.log("Video stored at:", processedUrl);
      
      // Store a reference in the database
      const { data, error } = await supabase
        .from('user_content_history')
        .insert({
          user_id: userId,
          content_type: 'combined_video',
          content_url: processedUrl,
          metadata: {
            source_videos: videoUrls,
            audio_track: audioUrl,
            status: 'completed',
            processing_type: 'ffmpeg'
          }
        })
        .select();
        
      if (error) {
        console.error("Database error:", error);
      } else {
        console.log("Created processing record:", data);
      }
      
      return new Response(
        JSON.stringify({ 
          combinedVideoUrl: processedUrl,
          message: "Videos combined successfully with FFmpeg."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
      
    } catch (ffmpegError) {
      console.error("FFmpeg processing error:", ffmpegError);
      
      // Fallback to returning the first video when FFmpeg processing fails
      const fallbackUrl = videoUrls[0];
      
      // Log the fallback and return a response
      console.log("Falling back to first video:", fallbackUrl);
      
      // Store a reference in the database, noting the failure
      await supabase
        .from('user_content_history')
        .insert({
          user_id: userId,
          content_type: 'combined_video',
          content_url: fallbackUrl,
          metadata: {
            source_videos: videoUrls,
            audio_track: audioUrl,
            status: 'failed',
            error: ffmpegError.toString(),
            fallback: 'used_first_video'
          }
        });
        
      return new Response(
        JSON.stringify({ 
          combinedVideoUrl: fallbackUrl,
          message: "FFmpeg processing failed. Falling back to the first video.",
          error: ffmpegError.toString()
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
  } catch (error) {
    return processErrorResponse(error);
  }
});
