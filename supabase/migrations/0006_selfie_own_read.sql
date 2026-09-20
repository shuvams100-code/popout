create policy "own selfie read" on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
