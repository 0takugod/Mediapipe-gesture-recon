import React, { useEffect } from "react";
const FunctionComponent = () => {
  const [name, SetName] = React.useState("Bhavay");
  useEffect(() => {
    alert(1);
    SetName(!name);
  });

  return (
    <div>
      <p>{name}</p>
    </div>
  );
};

export default FunctionComponent;

//can create multiple use effects ong
