-- Add PayIt as a payment method option for the UAE market. Existing
-- jazzcash/easypaisa values are left in place for historical rows but are
-- no longer offered in the UI's payment method picker.
alter type payment_method add value if not exists 'payit';
