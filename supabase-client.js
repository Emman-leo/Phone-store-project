
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://iswhrxlsoltxvwhduezg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzd2hyeGxzb2x0eHZ3aGR1ZXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc1NDcsImV4cCI6MjA4MzMwMzU0N30.yi2zuDIq80uqEP23yrxFPnGL2RzTweFf817-GDqsugI';

export const supabase = createClient(supabaseUrl, supabaseKey);
