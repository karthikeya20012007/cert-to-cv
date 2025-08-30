import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { History, Download, Eye, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Version {
  id: string;
  version_number: number;
  content: any;
  pdf_path?: string;
  docx_path?: string;
  changes_description?: string;
  created_at: string;
}

export const VersionHistory = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchVersions();
    }
  }, [user]);

  const fetchVersions = async () => {
    try {
      // First get the user's active resume
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (resumeError && resumeError.code !== 'PGRST116') {
        throw resumeError;
      }

      if (!resumeData) {
        setVersions([]);
        setLoading(false);
        return;
      }

      // Then get all versions for that resume
      const { data, error } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('resume_id', resumeData.id)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadVersion = async (version: Version, format: 'pdf' | 'docx') => {
    try {
      const filePath = format === 'pdf' ? version.pdf_path : version.docx_path;
      if (!filePath) {
        toast({
          title: 'Not Available',
          description: `${format.toUpperCase()} version not available for this version`,
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from('generated-resumes')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-v${version.version_number}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading version:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No version history</h3>
        <p className="text-muted-foreground">
          Version history will appear here as you update your resume
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version) => (
        <Card key={version.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    Version {version.version_number}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(version.created_at).toLocaleDateString()}
                  </span>
                </div>
                {version.changes_description && (
                  <p className="text-sm text-muted-foreground">
                    {version.changes_description}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                {version.pdf_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadVersion(version, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
                {version.docx_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadVersion(version, 'docx')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    DOCX
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};