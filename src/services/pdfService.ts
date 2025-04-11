
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { StoryScene } from '@/types';

// Add Myanmar font support
import { LANGUAGES, type LanguageOption } from '@/utils/translationUtils';

// Import Myanmar font (NotoSansMyanmar)
// This base64 encoded font will be used for Myanmar text rendering
import { NotoSansMyanmar } from '@/fonts/NotoSansMyanmar'; 

export const generateStoryPDF = async (
  title: string, 
  scenes: StoryScene[], 
  characterDetails?: Record<string, string>,
  language: LanguageOption = 'en'
): Promise<string> => {
  try {
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });
    
    // Add Myanmar font to the PDF
    if (language === 'my') {
      pdf.addFileToVFS('NotoSansMyanmar-Regular.ttf', NotoSansMyanmar);
      pdf.addFont('NotoSansMyanmar-Regular.ttf', 'NotoSansMyanmar', 'normal');
      pdf.setFont('NotoSansMyanmar', 'normal');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    
    // Set up variables for positioning
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add title page
    pdf.setFontSize(24);
    pdf.setFont(language === 'my' ? 'NotoSansMyanmar' : 'helvetica', 'bold');
    pdf.text(title, pageWidth / 2, pageHeight / 4, { align: 'center' });
    
    // Add generated date
    pdf.setFontSize(12);
    pdf.setFont(language === 'my' ? 'NotoSansMyanmar' : 'helvetica', 'normal');
    const date = new Date().toLocaleDateString();
    pdf.text(`Generated on ${date}`, pageWidth / 2, pageHeight / 4 + 10, { align: 'center' });
    
    // Add language information
    pdf.setFontSize(10);
    pdf.text(`Language: ${LANGUAGES[language]}`, pageWidth / 2, pageHeight / 4 + 20, { align: 'center' });
    
    // Add character details if available
    if (characterDetails && Object.keys(characterDetails).length > 0) {
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.setFont(language === 'my' ? 'NotoSansMyanmar' : 'helvetica', 'bold');
      pdf.text('Character Details', pageWidth / 2, margin, { align: 'center' });
      
      let yPos = margin + 10;
      pdf.setFontSize(12);
      
      for (const [key, value] of Object.entries(characterDetails)) {
        if (value) {
          // Format the key to be more readable (e.g., mainCharacter -> Main Character)
          const formattedKey = key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          
          pdf.setFont(language === 'my' ? 'NotoSansMyanmar' : 'helvetica', 'bold');
          pdf.text(`${formattedKey}:`, margin, yPos);
          
          pdf.setFont(language === 'my' ? 'NotoSansMyanmar' : 'helvetica', 'normal');
          
          // Handle text wrapping for potentially long character descriptions
          const splitText = pdf.splitTextToSize(value, contentWidth);
          pdf.text(splitText, margin, yPos + 5);
          
          yPos += 10 + (splitText.length * 5);
          
          // Check if we need to add a new page
          if (yPos > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
        }
      }
    }
    
    // Add each scene to the PDF
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      pdf.addPage();
      
      // Scene header
      pdf.setFontSize(16);
      pdf.setFont(language === 'my' ? 'NotoSansMyanmar' : 'helvetica', 'bold');
      pdf.text(`Scene ${i + 1}`, pageWidth / 2, margin, { align: 'center' });
      
      // Scene text
      pdf.setFontSize(12);
      pdf.setFont(language === 'my' ? 'NotoSansMyanmar' : 'helvetica', 'normal');
      const splitText = pdf.splitTextToSize(scene.text, contentWidth);
      pdf.text(splitText, margin, margin + 10);
      
      // Add image if available
      if (scene.imageUrl) {
        try {
          // Calculate image position - center below text
          const textHeight = splitText.length * 5; // Approximate height of text
          let imgY = margin + 20 + textHeight;
          
          // Adjust the image size to fit the page width with margins
          const imgWidth = contentWidth;
          const imgHeight = imgWidth * 0.75; // Maintain aspect ratio (4:3)
          
          // Check if image would go beyond page bounds and add new page if needed
          if (imgY + imgHeight > pageHeight - margin) {
            pdf.addPage();
            imgY = margin;
          }
          
          // Add image
          pdf.addImage(scene.imageUrl, 'JPEG', margin, imgY, imgWidth, imgHeight);
        } catch (error) {
          console.error(`Failed to add image for scene ${i + 1}:`, error);
          pdf.text('(Image could not be included)', margin, margin + 20 + (splitText.length * 5));
        }
      }
    }
    
    // Generate and return the PDF as a data URL
    return pdf.output('datauristring');
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
};
