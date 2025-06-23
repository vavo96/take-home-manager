import { AnalysisSummary, FileAnalysisResult, PIIDetectionResult } from "@/interfaces";
import { PIIType } from "@/types";

export class AnalysisService {
    /**
     * Creates a comprehensive summary from analysis results
     */
    static createSummary(results: FileAnalysisResult[]): AnalysisSummary {
      const startTime = Date.now();
      
      const totalFiles = results.length;
      const successfulFiles = results.filter(r => r.success).length;
      const failedFiles = totalFiles - successfulFiles;
      
      const allFindings = results.flatMap(r => r.success ? r.piiFindings : []);
      const findingsByType = this.groupFindingsByType(allFindings);
      
      const errors = results
        .filter(r => !r.success)
        .map(r => ({
          filename: r.filename,
          error: r.error || 'Unknown error'
        }));
  
      return {
        totalFiles,
        successfulFiles,
        failedFiles,
        totalPIIFound: allFindings.length,
        findingsByType,
        analysisComplete: true,
        hasErrors: failedFiles > 0,
        errors,
        processingTimeMs: Date.now() - startTime,
      };
    }
  
    /**
     * Formats analysis results into markdown summary
     */
    static formatSummaryMarkdown(summary: AnalysisSummary): string {
      let markdown = `## 🔍 PII Analysis Results\n\n`;
      
      // Overview section
      markdown += `### 📊 Overview\n`;
      markdown += `- **Files Processed:** ${summary.totalFiles} (${summary.successfulFiles} successful, ${summary.failedFiles} failed)\n`;
      markdown += `- **Total PII Instances Found:** ${summary.totalPIIFound}\n`;
      
      if (summary.processingTimeMs) {
        markdown += `- **Processing Time:** ${summary.processingTimeMs}ms\n`;
      }
      
      markdown += `\n`;
  
      // Failed files section
      if (summary.hasErrors && summary.errors?.length) {
        markdown += `### ⚠️ Processing Errors\n`;
        summary.errors.forEach(error => {
          markdown += `- **${error.filename}**: ${error.error}\n`;
        });
        markdown += `\n`;
      }
  
      // PII findings summary
      if (summary.totalPIIFound > 0) {
        markdown += `### 🚨 PII Detection Summary\n`;
        Object.entries(summary.findingsByType).forEach(([type, count]) => {
          const displayType = this.formatPIIType(type as PIIType);
          const emoji = this.getPIIEmoji(type as PIIType);
          markdown += `- ${emoji} **${displayType}:** ${count} instance${count > 1 ? 's' : ''}\n`;
        });
        markdown += `\n`;
      } else if (summary.successfulFiles > 0) {
        markdown += `### ✅ Clean Results\n`;
        markdown += `All successfully processed files appear to be clean of detectable personally identifiable information.\n\n`;
      }
  
      return markdown;
    }
  
    /**
     * Formats detailed findings for a specific file
     */
    static formatFileDetails(result: FileAnalysisResult): string {
      if (!result.success || result.piiFindings.length === 0) {
        return '';
      }
  
      let details = `#### 📄 ${result.filename}\n`;
      
      // Group findings by type
      const grouped = this.groupFindingsByType(result.piiFindings);
      
      Object.entries(grouped).forEach(([type, count]) => {
        const findings = result.piiFindings.filter(f => f.type === type);
        const displayType = this.formatPIIType(type as PIIType);
        const emoji = this.getPIIEmoji(type as PIIType);
        
        details += `\n${emoji} **${displayType}** (${count} found):\n`;
        
        findings.forEach((finding, index) => {
          details += `  ${index + 1}. \`${finding.value}\``;
          details += ` (Confidence: ${Math.round(finding.confidence * 100)}%)\n`;
          
          if (finding.context && finding.context.trim()) {
            const redactedContext = this.redactSensitiveContext(finding.context, finding.value);
            details += `     *Context:* "${redactedContext}"\n`;
          }
        });
      });
      
      details += `\n`;
      return details;
    }
  
    /**
     * Groups findings by PII type
     */
    private static groupFindingsByType(findings: PIIDetectionResult[]): Record<PIIType, number> {
      return findings.reduce((acc, finding) => {
        acc[finding.type] = (acc[finding.type] || 0) + 1;
        return acc;
      }, {} as Record<PIIType, number>);
    }
  
    /**
     * Formats PII type for display
     */
    private static formatPIIType(type: PIIType): string {
      const typeMap: Record<PIIType, string> = {
        email: 'Email Addresses',
        phone: 'Phone Numbers',
        ssn: 'Social Security Numbers', 
        credit_card: 'Credit Card Numbers',
        name: 'Names',
        address: 'Addresses'
      };
      
      return typeMap[type] || type.replace('_', ' ').toUpperCase();
    }

    private static getPIIEmoji(type: PIIType): string {
      const emojiMap: Record<PIIType, string> = {
        email: '📧',
        phone: '📱',
        ssn: '🆔',
        credit_card: '💳',
        name: '👤',
        address: '🏠'
      };
      
      return emojiMap[type] || '🔍';
    }

    /**
     * Redacts sensitive information from context
     */
    private static redactSensitiveContext(context: string, originalValue: string): string {
      let redactedContext = context;
      
      // Replace the original sensitive value in context
      redactedContext = redactedContext.replace(
        new RegExp(originalValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        '[REDACTED]'
      );
      
      // Limit context length
      if (redactedContext.length > 100) {
        redactedContext = redactedContext.substring(0, 100) + '...';
      }
      
      return redactedContext.trim();
    }
  
    /**
     * Validates analysis results
     */
    static validateResults(results: unknown): results is FileAnalysisResult[] {
      if (!Array.isArray(results)) {
        return false;
      }
      
      return results.every(result => 
        result && 
        typeof result === 'object' &&
        'filename' in result &&
        'fileType' in result &&
        'success' in result &&
        'analysisDate' in result &&
        'piiFindings' in result &&
        Array.isArray(result.piiFindings)
      );
    }
  
    /**
     * Gets risk level based on PII findings
     */
    static getRiskLevel(findings: PIIDetectionResult[]): 'low' | 'medium' | 'high' | 'critical' {
      if (findings.length === 0) return 'low';
      
      const highRiskTypes: PIIType[] = ['ssn', 'credit_card'];
      const hasHighRisk = findings.some(f => highRiskTypes.includes(f.type));
      
      if (hasHighRisk) return 'critical';
      if (findings.length >= 10) return 'high';
      if (findings.length >= 5) return 'medium';
      
      return 'low';
    }
  
    /**
     * Gets recommendations based on findings
     */
    static getRecommendations(summary: AnalysisSummary): string[] {
      const recommendations: string[] = [];
      
      if (summary.totalPIIFound === 0) {
        recommendations.push('No PII detected - files appear to be safe for sharing');
      } else {
        recommendations.push('PII detected - review before sharing or storing');
        
        if (summary.findingsByType.ssn || summary.findingsByType.credit_card) {
          recommendations.push('High-risk PII found (SSN/Credit Cards) - handle with extreme caution');
        }
        
        if (summary.findingsByType.email) {
          recommendations.push('Email addresses found - consider data privacy implications');
        }
        
        if (summary.findingsByType.phone) {
          recommendations.push('Phone numbers detected - verify consent for contact information usage');
        }
        
        recommendations.push('Consider implementing data anonymization or encryption');
      }
      
      if (summary.hasErrors) {
        recommendations.push('Some files failed processing - manual review recommended');
      }
      
      return recommendations;
    }
}