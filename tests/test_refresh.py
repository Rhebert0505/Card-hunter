import importlib.util, pathlib, unittest, json, tempfile
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('refresh',pathlib.Path(__file__).parents[1]/'scripts/refresh_market.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class FeedTests(unittest.TestCase):
 def test_sealed_and_variant_join(self):
  products=[{'productId':1,'name':'Set Booster Box','extendedData':[]},{'productId':2,'name':'Charizard','extendedData':[{'name':'Number','value':'123'}]},{'productId':3,'name':'Booster Box Sleeves','extendedData':[]}]
  prices=[{'productId':1,'marketPrice':100,'subTypeName':'Normal'},{'productId':2,'marketPrice':20,'subTypeName':'Normal'},{'productId':2,'marketPrice':50,'subTypeName':'Foil'},{'productId':3,'marketPrice':8,'subTypeName':'Normal'}]
  rows=m.rows_for('Pokémon',{'groupId':42,'name':'Set'},products,prices,'2026-11-13')
  self.assertEqual(len(rows),2);self.assertEqual(rows[0]['kind'],'sealed');self.assertEqual(rows[1]['id'],'2:Foil');self.assertEqual(rows[1]['market'],50)
 def test_missing_market_is_not_zero(self):
  rows=m.rows_for('Magic',{'groupId':1,'name':'Set'},[{'productId':1,'name':'Booster Pack'}],[{'productId':1,'marketPrice':None,'subTypeName':'Normal'}],'2026-11-13');self.assertEqual(rows,[])
 def test_feed_failure_preserves_prior_dated_prices(self):
  with tempfile.TemporaryDirectory() as directory:
   target=pathlib.Path(directory)/'market.json'
   original={'products':[{'id':'p','market':40,'date':'2026-11-10'}],'sourceUpdatedAt':'2026-11-10','complete':True}
   target.write_text(json.dumps(original))
   with patch.object(m,'OUT',target),patch.object(m,'get',side_effect=RuntimeError('feed unavailable')):
    with self.assertRaises(RuntimeError):m.refresh()
   stored=json.loads(target.read_text())
   self.assertEqual(stored['products'],original['products']);self.assertEqual(stored['sourceUpdatedAt'],'2026-11-10');self.assertFalse(stored['complete']);self.assertIn('refreshError',stored)
 def test_unchanged_source_records_check_without_redating_price(self):
  with tempfile.TemporaryDirectory() as directory:
   target=pathlib.Path(directory)/'market.json'
   original={'products':[{'id':'p','market':40,'date':'2026-11-13T20:05:52+00:00'}],'sourceUpdatedAt':'2026-11-13T20:05:52+00:00','complete':True}
   target.write_text(json.dumps(original))
   with patch.object(m,'OUT',target),patch.object(m,'get',return_value='2026-11-13T20:05:52+0000') as request:m.refresh()
   stored=json.loads(target.read_text());self.assertEqual(stored['products'],original['products']);self.assertIn('lastCheckedAt',stored);self.assertEqual(request.call_count,1)
if __name__=='__main__':unittest.main()
