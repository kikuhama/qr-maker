require "tmpdir"
require "fileutils"
require "rqrcode"
require 'rubyXL'
require 'rubyXL/convenience_methods/cell'
require 'rubyXL/convenience_methods/workbook'
require 'rubyXL/convenience_methods/worksheet'
require "zip"

module QRLib
  DEFAULT_QR_SIZE = 15
  QR_LEVELS = [:l, :m, :q, :h]
  DEFAULT_QR_LEVEL = :m
  
  def self.make_qr(url, size, level = :m)
    qr = RQRCode::QRCode.new(url, level: level)
    png = qr.as_png(
      bit_depth: 1,
      border_modules: 2,
      module_px_size: 4,
    )
    ds = png.to_datastream
    resolution = png.width / (size / 1000.0)
    phys_chunk = ChunkyPNG::Chunk::Physical.new(resolution, resolution, :meters)
    ds.physical_chunk = phys_chunk
    ds.to_blob
  end

  def self.make_qr_from_list(tempfile, level = :m)
    Dir.mktmpdir do |dir|
      zip_filename = File.join(dir, "qr.zip")
      book = RubyXL::Parser.parse(tempfile.path)
      sheet = book.worksheets[0]
      size = sheet[0][4].value.to_i
      if size < 1
        size = QRLib::DEFAULT_QR_SIZE
      end
      level = sheet[1][4] ? sheet[1][4].value.to_sym : DEFAULT_QR_LEVEL
      unless QR_LEVELS.include?(level)
        level = DEFAULT_QR_LEVEL
      end
      row = 1

      Zip::File.open(zip_filename, Zip::File::CREATE) do |zip|
        while sheet[row]
          url = sheet[row][0] ? sheet[row][0].value : nil
          basename = sheet[row][1] ? sheet[row][1].value : nil
          if url && basename
            qr_filename = File.join(dir, basename)
            IO.write(qr_filename, QRLib.make_qr(url, size, level))
            zip.add(basename, qr_filename)
          end
          row += 1
        end
      end
      IO.read(zip_filename)
    end
  end
end
