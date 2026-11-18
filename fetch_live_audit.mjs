import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env','utf8');
let url=''; let key='';
for(const line of env.split(/\r?\n/)){
  if(line.startsWith('VITE_SUPABASE_URL=')) url=line.slice('VITE_SUPABASE_URL='.length).trim();
  if(line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key=line.slice('VITE_SUPABASE_PUBLISHABLE_KEY='.length).trim();
}
const supabase = createClient(url, key);
const [catRes, prodRes, groupRes, valueRes, comboRes, cvRes] = await Promise.all([
  supabase.from('categories').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true}),
  supabase.from('products').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true}),
  supabase.from('product_option_groups').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true}),
  supabase.from('product_option_values').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true}),
  supabase.from('product_option_combinations').select('*'),
  supabase.from('product_option_combination_values').select('*'),
]);
const out = {
  fetchedAt: new Date().toISOString(),
  categories: catRes.data||[],
  products: prodRes.data||[],
  groups: groupRes.data||[],
  values: valueRes.data||[],
  combos: comboRes.data||[],
  comboValues: cvRes.data||[],
  errors: {
    categories: catRes.error,
    products: prodRes.error,
    groups: groupRes.error,
    values: valueRes.error,
    combos: comboRes.error,
    comboValues: cvRes.error,
  }
};
fs.writeFileSync('live_audit_raw.json', JSON.stringify(out,null,2),'utf8');
console.log(JSON.stringify({cats:out.categories.length,prods:out.products.length,groups:out.groups.length,vals:out.values.length,combos:out.combos.length,cv:out.comboValues.length},null,2));
