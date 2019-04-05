import React from 'react';

const About = () => (
  <>
    <div className="container about">
      <div className="row">
        <div className="col-xs-12" style={{ backgroundColor: '#cfd1d3' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }} >About</h2>
          <hr />

          <p> 
            <a href="https://www.earthcube.org/geocodes">Geoscience Cyber for Open Discovery in the Earth Sciences (GeoCODES)</a>, 
            the evolution of the P418 Pilot Project, is a production-ready package of intuitive
            web-based tools, REST APIs, and Python, R, and MATLAB notebook integration for a variety of services.
          </p>

          <p>
            Developed by <a href="http://www.isti.com/">Instrumental Software Technologies, Inc. (ISTI)</a>
          </p>

          <p>
            Powered by <a href="https://github.com/mozilla-services/react-jsonschema-form">react-jsonschema-form</a>. Bootstrap themes courtesy of <a href="http://bootswatch.com/">Bootswatch</a> and <a href="https://github.com/aalpern/bootstrap-solarized/">bootstrap-solarized</a>.
          </p>
        </div>
      </div>
    </div>
  </>
);  

export default About;