//tabsstyled.js
import InventoryIcon from "@mui/icons-material/Inventory";
import styled from "styled-components";
// Aquí se usa useSelector para acceder al estado de redux y determinar si el modo oscuro está activado
export const TabContainer = styled.div`
  display: flex;
  text-align: center;
  flex-direction: ${(props) => (props.mobile ? "row" : "column")};
  justify-content: center;
  /* background-color: aqua; */
  /* position: fixed; */
  /* z-index: 2; */
  margin-bottom: 30px;
  width: 80%; /* Default width for desktop */
  margin: 0 auto;
  /* background-color: aliceblue; */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding-bottom: 10px;

  /* Media query for mobile devices */
  @media (max-width: 768px) {
    display: flex;
    width: ${({ tamaño }) => (tamaño ? tamaño : "auto")};
  }

  /* Establecer ancho fijo para cada tab */
  > div {
    flex-shrink: 0;
    width: 85px; /* Ajustar según tus necesidades */
  }
`;
export const CustomInventoryIcon = styled(InventoryIcon)`
  font-size: 40px;
  color: ${(props) => (props.$darkMode ? "white" : "#535353")};
  filter: ${(props) =>
    props.$active
      ? "none"
      : props.$darkMode
      ? "drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))"
      : "drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))"};
`;
export const Tabs = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  scroll-snap-align: start;
  align-items: center;
  text-align: center;
  padding: 1.4em;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0);
  cursor: pointer;
  margin: 10px;
  transition: transform 0.5s;
  background: ${(props) =>
    props.$darkMode
      ? "linear-gradient(90deg, transparent 0%, transparent 43%, transparent 100%)"
      : "linear-gradient(90deg, transparent 0%, transparent 43%, transparent 100%)"};

  box-shadow: ${(props) =>
    props.$active
      ? props.$darkMode
        ? "inset 4px 4px 6px -1px #2d2d2d, inset -4px -4px 6px -1px #545454, -0.5px -0.5px 0px #000000, 0.5px 0.5px 4px #000000, 0px 12px 10px -10px #373737"
        : "inset 4px 4px 6px -1px rgba(0, 0, 0, 0.2), inset -4px -4px 6px -1px rgba(255, 255, 255, 0.7), -0.5px -0.5px 0px rgba(255, 255, 255, 1), 0.5px 0.5px 0px rgba(0, 0, 0, 0.15), 0px 12px 10px -10px rgba(0, 0, 0, 0.05)"
      : props.$darkMode
      ? "5px 6px 5px #171717, -3px -3px 5px #616161"
      : "5px 5px 5px #d0d0d0, -5px -5px 5px #ffffff"};

  transform: translateY(1px);
`;
export const Labels = styled.label`
  color: ${(props) => (props.$darkMode ? "white" : "black")};
  font-size: 12px;
`;
export const FormContent = styled.div`
  position: relative;
  margin-right: "20px";
  background: ${(props) =>
    props.$darkMode
      ? "linear-gradient(90deg, transparent 0%, transparent 43%, transparent 100%)"
      : "linear-gradient(90deg, transparent 0%, transparent 43%, transparent 100%)"};

  box-shadow: ${(props) =>
    props.$active
      ? props.$darkMode
        ? "inset 4px 4px 6px -1px #2d2d2d, inset -4px -4px 6px -1px #545454, -0.5px -0.5px 0px #000000, 0.5px 0.5px 4px #000000, 0px 12px 10px -10px #373737"
        : "inset 4px 4px 6px -1px rgba(0, 0, 0, 0.2), inset -4px -4px 6px -1px rgba(255, 255, 255, 0.7), -0.5px -0.5px 0px rgba(255, 255, 255, 1), 0.5px 0.5px 0px rgba(0, 0, 0, 0.15), 0px 12px 10px -10px rgba(0, 0, 0, 0.05)"
      : props.$darkMode
      ? "5px 6px 5px #171717, -3px -3px 5px #616161"
      : "5px 5px 5px #d0d0d0, -5px -5px 5px #ffffff"};

  /* display: inline-block;
  justify-content: center; */
  /* background-color: red; */
  /* border: 2px solid ${(props) =>
    props.$darkMode ? "#5535a5" : "#9e85d0"}; */
  border-radius: 10px;
  padding: 30px;
  /* box-shadow:
    6px 6px 10px -1px rgba(0, 0, 0, 0.15),
    -6px -6px 10px -1px rgba(255, 255, 255, 255); */
  /* border: 2px solid #e8e8e8; */
  width: 98%;
  margin: 10px 20px auto;
  @media (max-width: 768px) {
    width: 100%;
    margin: 10px auto;
  }
`;
export const MessageCardContainer = styled.div`
  overflow-x: scroll; /* Permitir desplazamiento horizontal */
  scroll-snap-type: x mandatory; /* Establecer cómo se deben "enganchar" las tarjetas */
  display: flex;
  flex-wrap: nowrap; /* Evitar que las tarjetas se envuelvan */
  background-color: aqua;
`;
export const MessageCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center; /* Centrar elementos horizontalmente */
  justify-content: center; /* Centrar elementos verticalmente */
  padding: 15px;
  width: ${({ widths }) => widths};
  height: ${({ heights }) => heights};
  border-radius: 10px;
  font-size: 20px;
  box-shadow: ${(props) =>
    props.darkMode
      ? "4px 4px 14px -1px #222222, -4px -4px 4px -1px #5A5A5A"
      : "4px 4px 2px -1px rgba(0, 0, 0, 0.15), -4px -4px 2px -1px rgba(255, 255, 255, 0.7)"};
  border: 1px solid rgba(0, 0, 0, 0);
  cursor: pointer;
  text-align: center;
  color: ${({ type }) => (type === "error" ? "#DE4343" : "#BCBCBC")};
  flex: 0 0 auto; /* Evitar que las tarjetas se estiren */
  scroll-snap-align: start;
  /* Media query para dispositivos móviles */
  @media (max-width: 768px) {
    width: 90%;
    height: 20%;
    font-size: 1em;
  }
`;

export const Counter = styled.div`
  margin-top: auto; /* Empujar hacia abajo el contador */
  font-size: 16px;
`;

export const FormContents = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  align-items: center;
  /* background-color: #EEEEEE; */
  border: 2px solid ${(props) => (props.$darkMode ? "#5535a5" : "#9e85d0")};
  border-radius: 10px;
  padding: 30px;
  box-shadow: 16px 16px 15px -5px rgba(0, 0, 0, 0.15),
    -16px -16px 30px -5px rgba(255, 255, 255, 255);
  /* border: 2px solid #e8e8e8; */
`;
