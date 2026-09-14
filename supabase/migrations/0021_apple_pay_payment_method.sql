-- Apple Pay is one of the most widely used payment methods in the UAE
-- alongside cards and PayIt. Add it as a distinct payment method.
alter type payment_method add value if not exists 'apple_pay';
