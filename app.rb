require "sinatra"
require "rqrcode"
require "./app-helper"
require "./lib/qr"

helpers AppHelper

configure do
  mime_type :png, "image/png"
  mime_type :zip, "application/zip"
end

get "/" do
  erb :index
end

# params[:url] : URL
# params[:size] : size (mm)
get "/make_qr" do
  content_type :png
  QRLib.make_qr(params[:url], params[:size].to_i)
end

# params[:file] : Excel file
post "/make_qr_from_list" do
  begin
    content_type :zip
    QRLib.make_qr_from_list(params[:file][:tempfile])
  rescue => ex
    #halt 500, ex.message
    raise ex
  end
end
