import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gsmaxkxooaverirtkdot.supabase.co";
const supabaseKey = "sb_publishable_y4BOehQuKshgos7R69hFYg_SKumk-Zl";

export const supabase = createClient(supabaseUrl, supabaseKey);