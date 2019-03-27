//@ts-check

export default {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://earthcube.isti.com/ucar-json-ld.dataset.schema.json",
  "title": "EarthCube GeoCODES Registered Dataset",
  "description": "",
  "type": "object",
  "properties": {
    "distribution": {
      "type": "array",
      "title": "Distribution",
      "description": "Provide information about the dataset's distribution online.",
      "items": {
        "type": "object",
        "required": [
          "@type",
          "contentUrl",
          "encodingFormat"
        ],
        "properties": {
          "@type": {
            "type": "string",
            "const": "DataDownload",
            "default": "DataDownload"
          },
          "contentUrl": {
            "type": "string",
            "title": "Dataset Download URL",
            "description": "Provide the URL for downloading the dataset file.",
            "example": "https://www.hydroshare.org/hsapi/resource/jjadfs89e4jjzx74jdjd784j",
            "format": "uri"
          },
          "encodingFormat": {
            "type": "string",
            "title": "File Type",
            "description": "Select the type of file you are making available.",
            "example": "application/zip, text/csv",
            "enum": [
              "text/html",
              "text/plain",
              "text/csv",
              "application/rtf",
              "application/pdf",
              "application/postscript",
              "application/msword",
              "application/powerpoint",
              "application/excel",
              "image/tiff",
              "image/png",
              "image/jpeg",
              "image/gif",
              "image/svg+xml",
              "video/x-ms-wmv",
              "video/quicktime",
              "video/mp4",
              "video/x-msvideo",
              "application/zip",
              "application/x-gzip",
              "application/x-hdf5",
              "application/x-netcdf4"
            ],
            "enumNames": [
              "HTML Document",
              "Plain Text Document",
              "CSV File",
              "RTF Document",
              "PDF Document",
              "PostScript Document / EPS Document",
              "Microsoft Word Document",
              "Microsoft PowerPoint Presentation",
              "Microsoft Excel Spreadsheet",
              "TIFF Image",
              "PNG Image",
              "JPEG Image",
              "GIF Image",
              "SVG Image",
              "Windows Media Video",
              "QuickTime Movie",
              "MPEG-4 Video",
              "AVI Video",
              "Zip File",
              "Gzip Tar File",
              "HDF5 File",
              "NetCDF4 File"
            ]
          }
        }
      }
    },
    "provider": {
      "type": "object",
      "title": "Data Provider",
      "description": "Provide information about the organization that has created the data.",
      "required": [
        "@type",
        "@id",
        "legalName",
        "url"
      ],
      "properties": {
        "@type": {
          "type": "string",
          "const": "Organization",
          "default": "Organization"
        },
        "@id": {
          "type": "string",
          "format": "uri"
        },
        "legalName": {
          "type": "string",
          "title": "Legal Name",
          "description": "Enter the name that is legally registered to the data provider.",
          "example": "Biological and Chemical Data Management Office"
        },
        "name": {
          "type": "string",
          "title": "Common Name",
          "description": "Enter a name for the data provider that is commonly used. This may be a shortened version of the legal name.",
          "example": "BCO-DMO"
        },
        "url": {
          "type": "string",
          "title": "URL or DOI URL",
          "description": "Enter the data provider's URL or DOI URL.",
          "example": "https://www.hydroshare.org",
          "format": "uri"
        }
      }
    },
    "publisher": {
      "type": "object",
      "title": "Publisher",
      "description": "Provide information about the organization maintaining the data catalog for distribution.",
      "required": [
        "@type",
        "@id",
        "name",
        "url"
      ],
      "properties": {
        "@type": {
          "type": "string",
          "const": "Organization",
          "default": "Organization"
        },
        "@id": {
          "type": "string",
          "format": "uri"
        },
        "description": {
          "type": "string",
          "title": "Description",
          "description": "Provide a description of the publisher, which could include its goal or purpose.",
          "example": "Continental Scientific Drilling Coordination Office"
        },
        "url": {
          "type": "string",
          "title": "URL or DOI URL",
          "description": "Enter the publisher's URL or DOI URL. The publisher is the organization maintaining the data catalog for distribution.",
          "example": "https://csdco.umn.edu/",
          "format": "uri"
        },
        "name": {
          "type": "string",
          "title": "Common Name",
          "description": "Enter a name for the publisher that is commonly used.",
          "example": "CSDCO"
        }
      }
    }
  }
}