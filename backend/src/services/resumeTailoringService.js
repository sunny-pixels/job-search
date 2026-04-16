const Groq = require("groq-sdk");
const config = require("../config/config");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const fs = require("fs").promises;
const path = require("path");

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

/**
 * Tailor resume content using AI
 * @param {object} resumeData - Original resume data
 * @param {object} jobData - Job requirements
 * @returns {Promise<object>} - Tailored content and modifications
 */
const tailorResumeContent = async (resumeData, jobData) => {
  console.log('🎨 [Tailoring] Starting AI resume tailoring...');
  
  const prompt = `You are a professional resume writer. Tailor this resume for the specific job posting.

ORIGINAL RESUME:
Name: ${resumeData.name || 'Candidate'}
Summary: ${resumeData.summary || 'Professional with experience in software development'}
Skills: ${(resumeData.skills || []).join(', ')}
Experience: ${JSON.stringify(resumeData.experience || [])}
Projects: ${JSON.stringify(resumeData.projects || [])}
Education: ${JSON.stringify(resumeData.education || [])}

JOB POSTING:
Title: ${jobData.job_title}
Company: ${jobData.employer_name}
Description: ${jobData.job_description?.substring(0, 1000) || ''}
Required Skills: ${jobData.job_highlights?.Qualifications?.join(', ') || 'Not specified'}
Responsibilities: ${jobData.job_highlights?.Responsibilities?.join(', ') || 'Not specified'}

INSTRUCTIONS:
1. Keep ALL factual information (names, dates, companies, education) EXACTLY as is
2. Rewrite experience bullets to emphasize skills matching the job requirements
3. Add relevant keywords from job description naturally
4. Reorganize skills to put most relevant ones first
5. Enhance project descriptions to highlight relevant technologies
6. Make summary more targeted to this specific role
7. Be HONEST - only emphasize existing skills, don't add fake ones
8. Keep professional tone and ATS-friendly format

CRITICAL: Return ONLY valid JSON with double quotes around ALL keys and string values. No markdown, no explanation, no code blocks.

{
  "summary": "tailored professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Jan 2023 - Present",
      "bullets": ["Enhanced bullet point 1", "Enhanced bullet point 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Enhanced description with relevant keywords",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": ["Degree, Institution, Year"]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2500
    });

    const rawResponse = response.choices[0].message.content.trim();
    console.log('🤖 [Tailoring] AI response received');
    console.log('🔍 [Tailoring] Raw AI response:', rawResponse.substring(0, 500));
    
    // Parse JSON response
    let tailoredData;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('🔍 [Tailoring] Cleaned response:', cleanedResponse.substring(0, 500));
      
      tailoredData = JSON.parse(cleanedResponse);
      
      console.log('🔍 [Tailoring] Parsed tailoredData.modifications type:', typeof tailoredData.modifications);
      console.log('🔍 [Tailoring] Parsed tailoredData.modifications value:', tailoredData.modifications);
      
      // Ensure modifications is an array (fix if AI returns string)
      if (tailoredData.modifications && typeof tailoredData.modifications === 'string') {
        console.log('⚠️ [Tailoring] Modifications is a STRING, parsing...');
        try {
          tailoredData.modifications = JSON.parse(tailoredData.modifications);
          console.log('✅ [Tailoring] Successfully parsed modifications from string');
        } catch {
          // If parsing fails, create default modifications array
          console.log('❌ [Tailoring] Failed to parse modifications string, using defaults');
          tailoredData.modifications = [
            { section: 'summary', type: 'modified', description: 'Tailored for job requirements' },
            { section: 'skills', type: 'reordered', description: 'Prioritized relevant skills' }
          ];
        }
      }
      
      // Ensure modifications exists and is an array
      if (!Array.isArray(tailoredData.modifications)) {
        console.log('⚠️ [Tailoring] Modifications is not an array, using defaults');
        tailoredData.modifications = [
          { section: 'summary', type: 'modified', description: 'Tailored for job requirements' },
          { section: 'skills', type: 'reordered', description: 'Prioritized relevant skills' }
        ];
      }
      
    } catch (parseError) {
      console.error('❌ [Tailoring] Failed to parse AI response:', parseError);
      console.error('Raw response:', rawResponse);
      throw new Error('Failed to parse AI response');
    }

    console.log('✅ [Tailoring] Content tailored successfully');
    console.log('✅ [Tailoring] Final modifications type:', typeof tailoredData.modifications, 'isArray:', Array.isArray(tailoredData.modifications));
    return tailoredData;
    
  } catch (error) {
    console.error('❌ [Tailoring] Error:', error.message);
    throw error;
  }
};

/**
 * Generate DOCX document from tailored content with professional formatting
 * @param {object} tailoredContent - Tailored resume content
 * @param {object} originalData - Original resume data (for name, contact)
 * @returns {Promise<Buffer>} - DOCX file buffer
 */
const generateDocx = async (tailoredContent, originalData) => {
  console.log('📄 [Tailoring] Generating DOCX document...');
  
  const children = [];

  // Header - Name (Large, Bold, Centered)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: originalData.name || 'Your Name',
          bold: true,
          size: 32,
          font: 'Arial'
        })
      ],
      alignment: 'center',
      spacing: { after: 50 }
    })
  );

  // Title/Role (if available from analysis)
  if (tailoredContent.summary) {
    const roleMatch = tailoredContent.summary.match(/^(.+?Engineer|.+?Developer|.+?Scientist)/i);
    if (roleMatch) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: roleMatch[1],
              size: 24,
              font: 'Arial'
            })
          ],
          alignment: 'center',
          spacing: { after: 100 }
        })
      );
    }
  }

  // Contact Info (Centered, smaller)
  if (originalData.email || originalData.phone) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Email: ${originalData.email || 'email@example.com'} | Phone: ${originalData.phone || '+1 XXX XXX XXXX'}`,
            size: 20,
            font: 'Arial'
          })
        ],
        alignment: 'center',
        spacing: { after: 300 }
      })
    );
  }

  // Summary Section
  if (tailoredContent.summary) {
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL SUMMARY',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 150 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: 'single',
            size: 6
          }
        }
      }),
      new Paragraph({
        text: tailoredContent.summary,
        spacing: { after: 250 },
        alignment: 'left'
      })
    );
  }

  // Skills Section
  if (tailoredContent.skills && tailoredContent.skills.length > 0) {
    children.push(
      new Paragraph({
        text: 'TECHNICAL SKILLS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 150 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: 'single',
            size: 6
          }
        }
      }),
      new Paragraph({
        text: tailoredContent.skills.join(' • '),
        spacing: { after: 250 }
      })
    );
  }

  // Experience Section
  if (tailoredContent.experience && tailoredContent.experience.length > 0) {
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL EXPERIENCE',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 150 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: 'single',
            size: 6
          }
        }
      })
    );

    tailoredContent.experience.forEach((exp, index) => {
      // Company and Role
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: exp.role || 'Position', 
              bold: true,
              size: 22
            }),
            new TextRun({ 
              text: ' | ' + (exp.company || 'Company'),
              size: 22
            })
          ],
          spacing: { after: 50, before: index > 0 ? 150 : 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: exp.duration || '',
              italics: true,
              size: 20,
              color: '666666'
            })
          ],
          spacing: { after: 100 }
        })
      );

      // Bullet points
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          children.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
              spacing: { after: 50 },
              indent: { left: 360 }
            })
          );
        });
      }
    });

    children.push(new Paragraph({ text: '', spacing: { after: 150 } }));
  }

  // Projects Section
  if (tailoredContent.projects && tailoredContent.projects.length > 0) {
    children.push(
      new Paragraph({
        text: 'PROJECTS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 150 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: 'single',
            size: 6
          }
        }
      })
    );

    tailoredContent.projects.forEach((project, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: project.name || 'Project', 
              bold: true,
              size: 22
            })
          ],
          spacing: { after: 50, before: index > 0 ? 150 : 0 }
        }),
        new Paragraph({
          text: project.description || '',
          spacing: { after: 50 }
        })
      );

      if (project.technologies && project.technologies.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Technologies: ',
                bold: true,
                size: 20
              }),
              new TextRun({
                text: project.technologies.join(', '),
                size: 20
              })
            ],
            spacing: { after: 100 }
          })
        );
      }
    });

    children.push(new Paragraph({ text: '', spacing: { after: 150 } }));
  }

  // Education Section
  if (tailoredContent.education && tailoredContent.education.length > 0) {
    children.push(
      new Paragraph({
        text: 'EDUCATION',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 150 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: 'single',
            size: 6
          }
        }
      })
    );

    tailoredContent.education.forEach(edu => {
      children.push(
        new Paragraph({
          text: edu,
          spacing: { after: 50 }
        })
      );
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,    // 0.5 inch
            right: 720,
            bottom: 720,
            left: 720
          }
        }
      },
      children: children
    }],
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 32,
            bold: true,
            color: '000000',
            font: 'Calibri'
          },
          paragraph: {
            spacing: { before: 240, after: 120 }
          }
        }
      ]
    }
  });

  const buffer = await Packer.toBuffer(doc);
  console.log('✅ [Tailoring] DOCX generated successfully');
  return buffer;
};

/**
 * Save DOCX file to uploads folder
 * @param {Buffer} buffer - DOCX file buffer
 * @param {string} filename - Filename
 * @returns {Promise<string>} - File path
 */
const saveDocxFile = async (buffer, filename) => {
  const uploadsDir = path.join(__dirname, '../../uploads/tailored');
  
  // Create directory if it doesn't exist
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }

  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);
  
  console.log('💾 [Tailoring] File saved:', filePath);
  return `/uploads/tailored/${filename}`;
};

/**
 * Estimate score improvement
 * @param {number} originalScore - Original match score
 * @returns {number} - Estimated improved score
 */
const estimateImprovedScore = (originalScore) => {
  // Estimate 15-25% improvement based on original score
  const improvement = (100 - originalScore) * 0.25;
  const estimatedScore = Math.min(95, Math.round(originalScore + improvement));
  return estimatedScore;
};

module.exports = {
  tailorResumeContent,
  generateDocx,
  saveDocxFile,
  estimateImprovedScore
};
