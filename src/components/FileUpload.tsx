import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, Award, Briefcase, GraduationCap, Code } from 'lucide-react';

const documentTypes = [
  { value: 'certificate', label: 'Certificate', icon: Award },
  { value: 'project', label: 'Project', icon: Code },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'experience', label: 'Experience', icon: Briefcase },
  { value: 'skill', label: 'Skill', icon: FileText },
];

export const FileUpload = () => {
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !documentType || !title) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the document title and type',
        variant: 'destructive',
      });
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setProgress(50);

      // Create document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title,
          type: documentType,
          file_path: fileName,
          status: 'pending'
        });

      if (dbError) throw dbError;

      setProgress(100);
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully! Processing will begin shortly.',
      });

      // Reset form
      setTitle('');
      setDocumentType('');
      setProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [user, documentType, title, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Document Title</label>
          <Input
            placeholder="e.g., AWS Cloud Practitioner Certificate"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Document Type</label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className={`border-2 border-dashed transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardContent 
          {...getRootProps()} 
          className="flex flex-col items-center justify-center py-12 cursor-pointer"
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOC, DOCX, TXT, and image files
            </p>
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      <Button 
        disabled={!title || !documentType || uploading}
        className="w-full"
        onClick={() => {
          if (title && documentType) {
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            input?.click();
          }
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </div>
  );
};