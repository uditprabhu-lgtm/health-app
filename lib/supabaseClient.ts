import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gsmaxkxooaverirtkdot.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbWF4a3hvb2F2ZXJpcnRrZG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjQ4NDgsImV4cCI6MjEwMTk0MDg0OH0.ceGMTeFAQct_dd2f_jNhHzEpzDUR8J23OniSD5yANO4";

export const supabase = createClient(supabaseUrl, supabaseKey);