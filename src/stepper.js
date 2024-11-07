import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Divider,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PropTypes from "prop-types";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./api/apiconfig";

const productRef = collection(db, "Product");

const NeumorphicStepLabel = styled(StepLabel)`
  .MuiStepIcon-root {
    color: #e0e0e0;
    box-shadow: 5px 5px 10px #bebebe, -5px -5px 10px #ffffff;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
  .MuiStepIcon-root.Mui-active,
  .MuiStepIcon-root.Mui-completed {
    color: #76c7c0;
  }
`;

const ResizableTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    overflow: hidden;
    resize: horizontal;
    min-width: 100px;
    width: auto;
  }
`;

const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: stretch;
`;

const DraggableField = ({
  id,
  index,
  label,
  value,
  onMoveField,
  onChange,
  options,
  onHover,
}) => {
  const [width, setWidth] = useState(100);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      const context = document.createElement("canvas").getContext("2d");
      context.font = window.getComputedStyle(inputRef.current).font;
      const textWidth = context.measureText(value).width;
      setWidth(textWidth + 20);
    }
  }, [value]);

  const [, ref] = useDrag({
    type: "textField",
    item: { id, index },
  });

  const [, drop] = useDrop({
    accept: "textField",
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        onMoveField(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div ref={(node) => ref(drop(node))} style={{ margin: "10px" }}>
      {id === "Cod_Prod" ? (
        <Select
          label={label}
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          displayEmpty
          variant="outlined"
          fullWidth
        >
          <MenuItem value="" disabled>
            Seleccione un código
          </MenuItem>
          {options.map((option, idx) => (
            <MenuItem
              key={idx}
              value={option}
              onMouseEnter={() => onHover(option)}
            >
              {option}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <ResizableTextField
          label={label}
          variant="outlined"
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          inputProps={{
            ref: inputRef,
            style: { width: `${width}px` },
          }}
        />
      )}
    </div>
  );
};

const FormularioConStepper = ({
  headers,
  formValues,
  handleInputChange,
  selectedColumns,
  codProdOptions,
  onHoverCodProd,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Informe de productos", "Stock y precio", "Fecha y almacen"];
  const [fields, setFields] = useState(() => {
    const savedOrder = localStorage.getItem("fieldOrder");
    return savedOrder ? JSON.parse(savedOrder) : headers;
  });
  const [stepFields, setStepFields] = useState(() => {
    const savedStepFields = JSON.parse(localStorage.getItem("stepFields")) || {
      1: ["Stock", "Precio"],
      2: ["Fecha", "Almacen"],
    };
    return savedStepFields;
  });

  const handleMoveField = (fromIndex, toIndex, stepIndex) => {
    const updatedFields =
      stepIndex === 0 ? [...fields] : [...stepFields[stepIndex]];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);

    if (stepIndex === 0) {
      setFields(updatedFields);
      localStorage.setItem("fieldOrder", JSON.stringify(updatedFields));
    } else {
      const updatedStepFields = { ...stepFields, [stepIndex]: updatedFields };
      setStepFields(updatedStepFields);
      localStorage.setItem("stepFields", JSON.stringify(updatedStepFields));
    }
  };

  const getFieldsForStep = (stepIndex) => {
    if (stepIndex === 1 || stepIndex === 2) {
      return stepFields[stepIndex];
    }
    return fields.filter((field) => selectedColumns && selectedColumns[field]);
  };

  const handleSave = async () => {
    try {
      // Combinar los campos seleccionados de "Informe de productos" y los campos de los otros steps
      const allSelectedFields = {
        ...selectedColumns,
        ...stepFields[1].reduce((obj, key) => {
          obj[key] = true;
          return obj;
        }, {}),
        ...stepFields[2].reduce((obj, key) => {
          obj[key] = true;
          return obj;
        }, {}),
      };

      // Filtrar solo los campos que están seleccionados o que pertenecen a los otros steps
      const filteredFormValues = Object.keys(formValues)
        .filter((key) => allSelectedFields[key])
        .reduce((obj, key) => {
          obj[key] = formValues[key];
          return obj;
        }, {});

      await addDoc(productRef, filteredFormValues);
      alert("Datos guardados exitosamente en Firestore");
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("Hubo un error al guardar los datos");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <NeumorphicStepLabel>{label}</NeumorphicStepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          {activeStep === steps.length ? (
            <div>
              <Typography variant="h6" align="center">
                ¡Todos los pasos completados!
              </Typography>
              <Button onClick={() => setActiveStep(0)}>Reiniciar</Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSave}
                style={{ marginLeft: "10px" }}
              >
                Guardar
              </Button>
            </div>
          ) : (
            <Card style={{ marginTop: "20px" }}>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" gutterBottom align="center">
                  {steps[activeStep]}
                </Typography>
                <Divider style={{ margin: "20px 0" }} />
                <Grid container spacing={2}>
                  {getFieldsForStep(activeStep).map((field, index) => (
                    <FormRow key={field}>
                      <DraggableField
                        id={field}
                        index={index}
                        label={field}
                        value={formValues[field] || ""}
                        onMoveField={(fromIndex, toIndex) =>
                          handleMoveField(fromIndex, toIndex, activeStep)
                        }
                        onChange={handleInputChange}
                        options={field === "Cod_Prod" ? codProdOptions : []}
                        onHover={field === "Cod_Prod" ? onHoverCodProd : null}
                      />
                    </FormRow>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => prev - 1)}
              style={{ marginRight: "10px" }}
            >
              Atrás
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setActiveStep((prev) => prev + 1)}
            >
              {activeStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
            </Button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

FormularioConStepper.propTypes = {
  headers: PropTypes.array.isRequired,
  formValues: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  selectedColumns: PropTypes.object,
  codProdOptions: PropTypes.array,
  onHoverCodProd: PropTypes.func,
};

export default FormularioConStepper;
