export const incrementVideoCount = async (credits = 1) => {
  try {
    const userId = getUserId();
    if (!userId) return false;

    const { data, error } = await supabase
      .from('user_usage')
      .select('video_count')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const currentCount = data?.video_count || 0;
    const newCount = currentCount + credits;

    if (newCount > VIDEO_LIMIT) return false;

    const { error: updateError } = await supabase
      .from('user_usage')
      .upsert({ 
        user_id: userId, 
        video_count: newCount 
      });

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error("Failed to increment video count:", error);
    return false;
  }
};
