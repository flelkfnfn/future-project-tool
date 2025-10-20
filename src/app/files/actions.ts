'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(formData: FormData) {
  const supabase = await createClient()

  const file = formData.get('file') as File
  if (!file || file.size === 0) {
    return
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `public/${fileName}`;

  // 1. Supabase Storage에 파일 업로드
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('project-files') // 버킷 이름
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error("파일 업로드 오류:", uploadError);
    return;
  }

  // 2. 업로드된 파일의 공개 URL 가져오기
  const { data: publicUrlData } = supabase.storage
    .from('project-files')
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    console.error("공개 URL 가져오기 오류:", publicUrlData);
    return;
  }

  // 3. 파일 메타데이터를 데이터베이스에 저장
  const { error: insertError } = await supabase.from('files').insert({
    name: file.name, // 원본 파일 이름
    url: publicUrlData.publicUrl,
  });

  if (insertError) {
    console.error("파일 메타데이터 저장 오류:", insertError);
    // TODO: 데이터베이스 저장 실패 시, 스토리지에 업로드된 파일 삭제 로직 추가
    return;
  }

  revalidatePath('/files')
}

export async function deleteFile(id: number, fileUrl: string) {
  const supabase = await createClient();

  // 1. Supabase Storage에서 파일 삭제
  // URL에서 파일 경로 추출 (예: .../storage/v1/object/public/project-files/public/uuid.ext -> public/uuid.ext)
  const filePath = fileUrl.split('project-files/')[1];
  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([filePath]);

    if (storageError) {
      console.error("스토리지 파일 삭제 오류:", storageError);
      // 오류 발생 시에도 데이터베이스 삭제는 시도
    }
  }

  // 2. 데이터베이스에서 파일 메타데이터 삭제
  const { error: dbError } = await supabase.from('files').delete().eq('id', id);

  if (dbError) {
    console.error("데이터베이스 파일 메타데이터 삭제 오류:", dbError);
    return;
  }

  revalidatePath('/files');
}
