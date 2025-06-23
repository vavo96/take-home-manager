import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY!});
    try {

        const { messages } = await req.json();

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: messages,
        });
        const text = result.text;

        return new Response(JSON.stringify({ 
            text,
            model: 'gemini-2.5-flash',
            usage: 'free_tier'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Gemini API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Gemini API error',
            fallback: true,
            text: "I'm ready to help with PII detection using local pattern matching."
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * implement ai sdk for chat temporarily
export async function _POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        const response = streamText({
            model: openai("gpt-4o-mini"),
            messages,
            tools: {
                pii_detector: tool({
                    description: 'Analyze uploaded files (PDF or images) for personally identifiable information (PII). This tool can detect emails, phone numbers, SSNs, credit card numbers, and names.',
                    parameters: z.object({
                        instruction: z.string().describe('Instructions for the PII detection analysis'),
                    }),
                    execute: async ({ instruction }) => {
                        try {
                            return {
                                message: `PII Detector tool is ready to analyze files. ${instruction}
                                **To use this tool:**
                                1. Upload PDF documents or image files using the file upload area
                                2. The tool will automatically scan for:
                                    - Email addresses
                                    - Phone numbers  
                                    - Social Security Numbers (SSN)
                                    - Credit card numbers
                                    - Names
                                    - Other potential PII

                                **Supported file types:**
                                - PDF documents
                                - Images (JPG, PNG, GIF, BMP, WebP)
                                - Maximum file size: 10MB per file

                                Please upload your files and I'll analyze them for potential PII immediately.`,
                                toolUsed: 'pii_detector',
                                capabilities: [
                                    'Email detection',
                                    'Phone number detection', 
                                    'SSN detection',
                                    'Credit card detection',
                                    'Name detection',
                                    'OCR for images',
                                    'PDF text extraction'
                                ]
                            };
                        } catch (error) {
                            console.error('Error in pii_detector:', error);
                            return {
                                message: 'Error initializing PII detector',
                                error: error instanceof Error ? error.message : 'Unknown error',
                                toolUsed: 'pii_detector',
                                success: false
                            };
                        }
                    },
                }),
                analyze_pii_results: tool({
                    description: 'Analyze the results of the PII detection analysis',
                    parameters: z.object({
                        results: z.array(z.object({
                            filename: z.string(),
                            fileType: z.enum(['pdf', 'image']),
                            piiFindings: z.array(z.object({
                                type: z.enum(['email', 'phone', 'ssn', 'credit_card', 'name', 'address']),
                                value: z.string(),
                                confidence: z.number(),
                                position: z.object({
                                    start: z.number(),
                                    end: z.number(),
                                }),
                                context: z.string().optional(),
                            })),
                            analysisDate: z.string(),
                            success: z.boolean(),
                            error: z.string().optional(),
                        })),
                    }),
                    execute: async ({ results }) => {
                        try {
                            console.log("results", results);
                            
                            const totalFiles = results.length;
                            const successfulFiles = results.filter(r => r.success).length;
                            const failedFiles = totalFiles - successfulFiles;
                            
                            const allFindings = results.flatMap(r => r.success ? r.piiFindings : []);
                            const findingsByType = allFindings.reduce((acc, finding) => {
                                acc[finding.type] = (acc[finding.type] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);

                            let summary = `## PII Analysis Results\n\n`;
                            summary += `**Files Processed:** ${totalFiles} (${successfulFiles} successful, ${failedFiles} failed)\n`;
                            summary += `**Total PII Instances Found:** ${allFindings.length}\n\n`;

                            // Handle failed files first
                            if (failedFiles > 0) {
                                summary += `### ⚠️ Failed Files:\n`;
                                results.filter(r => !r.success).forEach(result => {
                                    summary += `- **${result.filename}**: ${result.error || 'Unknown error'}\n`;
                                });
                                summary += `\n`;
                            }

                            if (allFindings.length > 0) {
                                summary += `### 🔍 PII Detection Summary:\n`;
                                Object.entries(findingsByType).forEach(([type, count]) => {
                                    const displayType = type.replace('_', ' ').toUpperCase();
                                    summary += `- **${displayType}:** ${count} instances\n`;
                                });
                                summary += `\n### Detailed Findings:\n\n`;

                                results.forEach(result => {
                                    if (result.success && result.piiFindings.length > 0) {
                                        summary += `#### 📄 ${result.filename}\n`;
                                        
                                        // Group findings by type
                                        const grouped = result.piiFindings.reduce((acc, finding) => {
                                            if (!acc[finding.type]) acc[finding.type] = [];
                                            acc[finding.type].push(finding);
                                            return acc;
                                        }, {} as Record<string, typeof result.piiFindings>);

                                        Object.entries(grouped).forEach(([type, items]) => {
                                            summary += `**${type.toUpperCase().replace('_', ' ')}** (${items.length} found):\n`;
                                            items.forEach((item, index) => {
                                                summary += `  ${index + 1}. "${item.value}" (Confidence: ${Math.round(item.confidence * 100)}%)\n`;
                                                if (item.context) {
                                                    summary += `     Context: "...${item.context}..."\n`;
                                                }
                                            });
                                            summary += '\n';
                                        });
                                        summary += `\n`;
                                    }
                                });
                            } else if (successfulFiles > 0) {
                                summary += `### ✅ No PII Detected\n`;
                                summary += `All successfully processed files appear to be clean of detectable personally identifiable information.\n\n`;
                            }

                            // Always return a consistent result object
                            return {
                                summary,
                                totalFiles,
                                successfulFiles,
                                failedFiles,
                                totalPIIFound: allFindings.length,
                                findingsByType,
                                analysisComplete: true,
                                hasErrors: failedFiles > 0,
                                errors: results.filter(r => !r.success).map(r => ({
                                    filename: r.filename,
                                    error: r.error
                                }))
                            };
                        } catch (error) {
                            console.error('Error in analyze_pii_results:', error);
                            
                            // Return a proper error response that matches expected format
                            return {
                                summary: `## Error Processing PII Analysis\n\nAn error occurred while analyzing the results: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                totalFiles: results?.length || 0,
                                successfulFiles: 0,
                                failedFiles: results?.length || 0,
                                totalPIIFound: 0,
                                findingsByType: {},
                                analysisComplete: false,
                                hasErrors: true,
                                errors: [{
                                    filename: 'system',
                                    error: error instanceof Error ? error.message : 'Unknown error'
                                }]
                            };
                        }
                    },
                }),
            },
            // Add error handling for the entire stream
            onFinish: (result) => {
                console.log('Stream finished:', result);
            },
        });

        return response.toDataStreamResponse();
    } catch (error) {
        console.error('Error in POST handler:', error);
        
        // Return a proper error response
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            }),
            { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    }
}
 */