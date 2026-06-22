import { query } from './api/db'; 
query(`INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true) ON CONFLICT (id) DO NOTHING;`)
  .then(() => console.log('Bucket created'))
  .catch(console.error);
