import React from 'react';

import Editor from './editor.jsx';

const fromJson = json => JSON.parse(json);
const toJson = val => JSON.stringify(val, null, 2);


export default ({
  editor,
  schema, 
  uiSchema,
  formData,

  onSchemaEdited, onUISchemaEdited, onFormDataEdited
}) => {
  return (
    <div className="col-sm-7">
      <Editor
        title="JSONSchema"
        theme={editor}
        code={toJson(schema)}
        onChange={onSchemaEdited}
      />
      <div className="row">
        <div className="col-sm-6">
          <Editor
            title="UISchema"
            theme={editor}
            code={toJson(uiSchema)}
            onChange={onUISchemaEdited}
          />
        </div>
        <div className="col-sm-6">
          <Editor
            title="formData"
            theme={editor}
            code={toJson(formData)}
            onChange={onFormDataEdited}
          />
        </div>
      </div>
    </div>
  );
}
