
// import * as geo from './components/geo-component.jsx';

export default {
  "@type": {
    "ui:widget": "hidden"
  },
  "@id": {
    "ui:widget": "hidden"
  },  
  "description": {
    "ui:widget": "textarea"
  },
  // "citation": {
  //   "items": {
  //     "ui:emptyValue": " "
  //   }
  // },
  "includedInDataCatalog": {
    "@id": {
      "ui:widget": "hidden"
    }
  },
  "distribution": {
    "@type": {
      "ui:widget": "hidden"
    },
    "items": {
      "@type": {
        "ui:widget": "hidden"
      },
      "encodingFormat": {
        "ui:widget": "select"
      }
    }
  },
  "provider": {
    "@type": {
      "ui:widget": "hidden"
    },
    "@id": {
      "ui:widget": "hidden"
    }
  },
  "publisher": {
    "@type": {
      "ui:widget": "hidden"
    },
    "@id": {
      "ui:widget": "hidden"
    },
    "description": {
      "ui:widget": "textarea"
    }
  },
  "creator": {
    "items": {
      "@type": {
        "ui:widget": "hidden"
      },
      "@id": {
        "ui:widget": "hidden"
      },
      "creator": {
        "@type": {
          "ui:widget": "hidden"
        },
        "@id": {
          "ui:widget": "hidden"
        },
        "identifier": {
          "@type": {
            "ui:widget": "hidden"
          }
        }
      }
    }
  },
  "spatialCoverage": {
    "items": {
      "@type": {
        "ui:widget": "hidden"
      },
      "geo": {
        "ui:field": "geo"
      }
    }
  },
  "variableMeasured": {
    "items": {
      "@type": {
        "ui:widget": "hidden"
      },
      "@id": {
        "ui:widget": "hidden"
      },  
      "description": {
        "ui:widget": "textarea"
      }
    }
  }
}