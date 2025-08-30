import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Resume {
  id: string;
  title: string;
  content: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ResumePreview = () => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchResume();
    }
  }, [user]);

  const fetchResume = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setResume(data);
    } catch (error) {
      console.error('Error fetching resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resume',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createResume = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: user?.id,
          title: 'My Resume',
          content: {
            personal: {
              name: '',
              email: user?.email || '',
              phone: '',
              location: '',
            },
            sections: {
              experience: [],
              education: [],
              skills: [],
              projects: [],
              certificates: [],
            }
          }
        })
        .select()
        .single();

      if (error) throw error;
      setResume(data);
      toast({
        title: 'Success',
        description: 'Resume created successfully',
      });
    } catch (error) {
      console.error('Error creating resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resume',
        variant: 'destructive',
      });
    }
  };

  const generateDocument = async (format: 'pdf' | 'docx') => {
    setGenerating(true);
    try {
      // This would integrate with document generation service
      toast({
        title: 'Coming Soon',
        description: `${format.toUpperCase()} generation will be available soon`,
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: 'Error',
        description: `Failed to generate ${format.toUpperCase()}`,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No resume found</h3>
        <p className="text-muted-foreground mb-6">
          Create your first resume to get started
        </p>
        <Button onClick={createResume}>
          <Plus className="h-4 w-4 mr-2" />
          Create Resume
        </Button>
      </div>
    );
  }

  const content = resume.content;
  const personal = content?.personal || {};
  const sections = content?.sections || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{resume.title}</h3>
          <p className="text-sm text-muted-foreground">
            Last updated {new Date(resume.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => generateDocument('pdf')}
            disabled={generating}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => generateDocument('docx')}
            disabled={generating}
          >
            <Download className="h-4 w-4 mr-2" />
            DOCX
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Name</span>
                <p className="font-medium">{personal.name || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email</span>
                <p className="font-medium">{personal.email || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Phone</span>
                <p className="font-medium">{personal.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Location</span>
                <p className="font-medium">{personal.location || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Experience</h4>
            {sections.experience?.length > 0 ? (
              <div className="space-y-3">
                {sections.experience.map((exp: any, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h5 className="font-medium">{exp.title}</h5>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No experience added</p>
            )}
          </div>

          {/* Skills */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Skills</h4>
            {sections.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sections.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No skills added</p>
            )}
          </div>

          {/* Certificates */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Certificates</h4>
            {sections.certificates?.length > 0 ? (
              <div className="space-y-2">
                {sections.certificates.map((cert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{cert.name}</span>
                    <Badge variant="outline">{cert.issuer}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No certificates added</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};