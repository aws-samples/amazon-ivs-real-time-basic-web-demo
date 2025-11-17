import { useEffect } from "react";
import { useNavigate } from "../../router";

function TokenIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
}

export default TokenIndex;
