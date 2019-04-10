import React from "react";

// export default function ErrorList(props) {
//   const { errors } = props;
//   return (
//     <div className="panel panel-danger errors">
//       <div className="panel-heading">
//         <h3 className="panel-title">Requirements :</h3>
//       </div>
//       <ul className="list-group">
//         {errors.map((error, i) => {
//           return (
//             <li key={i} className="list-group-item text-danger">
//               {error.stack}
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }

export default function ErrorList(props) {
  const { errors } = props;
  return (
    <div className="panel panel-danger errors">
      <div className="panel-heading">
       
        <h4 className="panel-title">Some fields in this step contain validation errors. Please see the highlighted properties below.</h4>
      </div>
      
    </div>
  );
}