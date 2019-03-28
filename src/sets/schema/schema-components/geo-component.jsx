import React from 'react';
import PropTypes from 'prop-types';

import * as R from 'ramda';
import {
  Circle,
  CircleMarker,
  FeatureGroup,
  Map,
  Marker,
  Polygon,
  Polyline,
  Popup,
  Rectangle,
  TileLayer,
} from 'react-leaflet';

// import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// delete L.Icon.Default.prototype._getIconUrl;

import BackContext from '../../../back-context.js';

import { morphDataPath } from '../../../funcs.js';

import * as validator from '../../../validators.js';

class LatLon extends React.Component {
  static contextType = BackContext;

  constructor(props) {
    console.log('LatLong [constructor()]');
    super(props);
    let { latitude = '', longitude = '' } = props.formData;
    if (latitude === 0) { latitude = ''; }
    if (longitude === 0) { longitude = ''; }
    this.state = { latitude, longitude };
  } 

  onChange(name) {
    return event => {
      console.log(name,' : ', event.target.value);
      this.setState({ [name]: event.target.value }, () => {
        const value = outboundTransform(this.state[name]);
        if (!value) { return; }
        const latlon = R.clone(this.props.formData);
        latlon[name] = value;
        this.props.onChange(latlon);
        
        function outboundTransform(input) {
          if (input === '') { return 0; }
          try {
            let out = parseFloat(input);
            if (!Number.isNaN(out)) { return out; }
          } catch(e) { ; }
          return null;
        }
      });
    }
  }

  render() {
    const backErrors = R.pathOr([], ['context', 'response', 'errors'], this);
    const dataPath = morphDataPath(this.props.dataPath);

    const backErrorsLatitude = filterErrors(backErrors, dataPath + '/latitude');
    const backErrorsLongitude = filterErrors(backErrors, dataPath + '/longitude');

    // const { latitude, longitude } = this.props.formData;
    const { latitude, longitude } = this.state;

    let errors = {
      latitude: validator.isLatitude(latitude),
      longitude: validator.isLongitude(longitude)
    };

    // const pass = Object.values(errors).every(v => v === true);

    let position = [
      errors.latitude === true ? latitude : 0,
      errors.longitude === true ? longitude : 0
    ];

    return (
      <div>
        <div className="container-fluid">
          <div className="row margin-md">
            <div className="col-sm-6">
              <span>Latitude:</span>
              <input className="margin-md" type="text" value={latitude} onChange={this.onChange("latitude")} pattern="[+-]?\d+"/>
              <div>{errors.latitude}</div>
              <div>{backErrorsLatitude}</div>
            </div>
            <div className="col-sm-6">
              <span>Longitude:</span>
              <input className="margin-md" type="text" value={longitude} onChange={this.onChange("longitude")} pattern="[+-]?\d+" />
              <div>{errors.longitude}</div>
              <div>{backErrorsLongitude}</div>
            </div>
          </div>
        </div>
        <div className="leaflet-container">
          <Map ref={this.map} center={position} zoom={13}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            />
            <Marker position={position}>
              <Popup>
                A pretty CSS3 popup. <br/> Easily customizable.
              </Popup>
            </Marker>
          </Map>
        </div>
      </div>
    );
  }
}

class Shape extends React.Component {
  static contextType = BackContext;

  constructor(props) {
    super(props);
    this.fg = React.createRef();
    this.map = React.createRef();
    this.state = { position : [37, -109.05] };
  } 

  componentDidUpdate() {
    this.adjustMap();
  }

  onChange(name) {
    return event => {
      const shape = R.clone(this.props.formData);
      shape[name] = event.target.value;
      this.props.onChange(shape);
    }
  }

  toCoords(str) {
    const coordPairs = /(-?\d*\.\d+,-?\d*\.\d+)/g;
    return str.match(coordPairs);
  }

  splitCoord(str) {
    return str.map(coord => coord.split(',').map(p => parseFloat(p, 10)));
  }

  center(bounds) {
    return [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2
    ];
  }
  
  captureFG = e => this.setState( {bounds: e.target.getBounds()} );

  adjustMap = () => {
    const fg = R.path(['fg','current', 'leafletElement'], this);
    const map = R.path(['map','current','leafletElement'], this);

    if (fg && map) {
      const bounds = fg.getBounds();
      if (bounds.isValid()) { map.fitBounds(fg.getBounds()); }
    }

    // 
    // if (this.map.current && this.state.bounds && this.state.bounds.isValid()) {
    //   this.map.current.leafletElement.fitBounds(this.state.bounds);
    //   return;
    // }
  }

  render() {
    console.log(this.fg);

    const backErrors = R.pathOr([], ['context', 'response', 'errors'], this);
    const dataPath = morphDataPath(this.props.dataPath);

    const backErrorsBox = filterErrors(backErrors, dataPath + '/box');
    const backErrorsPoly = filterErrors(backErrors, dataPath + '/polygon');

    const { box, polygon } = this.props.formData;

    let rect, poly;
    let validation = { box: validator.isBox(box), polygon: validator.isPolygon(polygon) };
    if (!box) { validation.box = ''; }
    if (!polygon) { validation.polygon = ''; }

    if (validation.box === true) { 
      try {
        let rectBounds = R.pipe(this.toCoords, this.splitCoord)(box);
        rect = (<Rectangle bounds={rectBounds} />); 
      } catch(err) { ; }
    }
    if (validation.polygon === true) { 
      try {
        let polyPoints = R.pipe(this.toCoords, this.splitCoord)(polygon);
        poly = (<Polygon positions={polyPoints} />); 
      } catch(err) { ; }
    }

    let position = this.state.position;

    this.adjustMap();

    return (
      <div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-8 col-xs-offset-2 ">
              <pre>Notes: No space <i>between</i> a coordinate pair. </pre>
              <pre>Example Box : 40.9719474,-109.0713774  36.9924303,-102.0463517 </pre>
              <pre>Example Polygon : 25.7617,-80.1918 32.3078,-64.7505 18.4655,-66.1057 </pre>
            </div>
          </div>
          <div className="row margin-md">
            <div className="col-sm-6">
              <span>Box:</span>
              <input className="margin-md w-100" type="text" value={box} onChange={this.onChange("box")} />
              <div>{typeof validation.box === "string" ? validation.box : undefined}</div>
              <div>{backErrorsBox}</div>
            </div>
            <div className="col-sm-6">
              <span>Polygon:</span>
              <input className="margin-md w-100" type="text" value={polygon} onChange={this.onChange("polygon")} />
              <div>{typeof validation.polygon === "string" ? validation.polygon : undefined}</div>
              <div>{backErrorsPoly}</div>
            </div>
          </div>
        </div>
        <div className="leaflet-container">
          <Map ref={this.map} center={position} zoom={13} >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            />
            <FeatureGroup 
              ref={this.fg} 
              // onAdd={this.captureFG} 
            >
              { rect }
              { poly }
            </FeatureGroup>
          </Map>
        </div>
      </div>
    );
  }
}

Shape.propTypes = {
  formData: PropTypes.shape({
    box: PropTypes.string,
    polygon: PropTypes.string
  })
};

export class OneOfSpliterManager extends React.Component {
  render() {
    console.log('[OneOfSplitterManager]');
    const dataPath = this.props.idSchema['$id'];

    const re = /spatialCoverage_(?<index>\d+)_geo/;
    const key = dataPath.match(re)[1] + R.pathOr('undefined', ['props', 'formData', '@type'] , this);

    return (
      <OneOfSpliter key={key} {...this.props} />
    )
  }
}

export class OneOfSpliter extends React.Component {
  constructor(props) {
    const { mergeAll, pick } = R;
    super(props);
    const formData = props.formData || {};
    this.state = { 
      selectedOption: formData['@type'] || "GeoCoordinates",
      formData: {
        latLon: mergeAll([
          { latitude:0, longitude:0, "@type": "GeoCoordinates" }
          ,
          pick(['latitude','longitude'], formData) 
        ]),
        shape: mergeAll([
          { box: "", polygon: "", "@type": "GeoShape" }
          ,
          pick(['box', 'polygon'], formData)
        ])
      }
    };
  };

  setStateOnChange = (obj, reset = false) => this.setState(obj, () => {
    if (this.state.selectedOption === 'GeoCoordinates') {
      this.props.onChange(this.state.formData.latLon);
    } else {
      this.props.onChange(this.state.formData.shape);
    }
  });

  formDataChange = (type, index) => {
    return (potential) => {
      const next = R.clone(this.state.formData);
      next[type] = potential;
      this.setStateOnChange({formData:next});
    };
  }

  handleOptionChange = changeEvent => {
    this.setStateOnChange({
      selectedOption: changeEvent.target.value
    });
  };

  render() {
    const dataPath = this.props.idSchema['$id'];
    
    const re = /spatialCoverage_(?<index>\d+)_geo/;
    const key = dataPath.match(re)[1] + this.state.selectedOption;

    return (
      <div>
        <div className="form-check">
          <label className="margin-xs">
            <input
              type="radio"
              name="react-tips"
              value="GeoCoordinates"
              checked={this.state.selectedOption === "GeoCoordinates"}
              onChange={this.handleOptionChange}
              className="form-check-input"
            />
            Point
        </label>
          <label className="margin-xs">
            <input
              className="margin-xs"
              type="radio"
              name="react-tips"
              value="GeoShape"
              checked={this.state.selectedOption === "GeoShape"}
              onChange={this.handleOptionChange}
              className="form-check-input"
            />
            Shape
        </label>
        </div>
        {
          this.state.selectedOption === "GeoCoordinates" ?
          <LatLon
            key={key}
            formData={this.state.formData.latLon}
            dataPath={dataPath}
            onChange={this.formDataChange('latLon')} />
          :
          <Shape
            key={key}
            formData={this.state.formData.shape}
            dataPath={dataPath}
            onChange={this.formDataChange('shape')} />
        }
      </div>
    );
  }
}

export function average(arr) {
  const sum = arr.reduce((acc, v) => acc + v);
  return sum / arr.length;
}

export function validate(formData, errors) {
  console.log('[validate]', formData);
  
  if (formData.spatialCoverage) {
    formData.spatialCoverage.forEach((spatial, m) => {
      spatial.geo.forEach((geo, n) => {
        const [res, errors] = validator.isValidGeo(geo);
        console.error(geo, 'error:', res, errors);
        formData.spatialCoverage[m].geo[n].errors = errors;
      });
    });
  }

  return errors;
}

function filterErrors(backErrors, dataPath) {
  const msgs = backErrors.filter(err => err.dataPath === dataPath).map(err => err.message);
  return msgs.map((text,i) => (<span key={i}>{text}</span>));
};