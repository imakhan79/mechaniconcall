-- Careem Pay is a major UAE/Dubai-based payment service (Careem, owned by
-- Uber) — add it alongside Apple Pay and PayIt as a top local option.
alter type payment_method add value if not exists 'careem_pay';
-- e& money (Etisalat's digital wallet) is another widely used UAE payment
-- service.
alter type payment_method add value if not exists 'e_and_money';
