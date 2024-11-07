import React, { useState, useEffect } from "react";
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  Snackbar,
  Alert,
  TableSortLabel,
  CardContent,
  Card,
  InputAdornment,
  Tooltip,
  Chip,
} from "@mui/material";
import { db } from "api/config/configfire";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoNotDisturbOnIcon from "@mui/icons-material/DoNotDisturbOn";

import ClearIcon from "@mui/icons-material/Clear";
import { openDB } from "idb";
import * as XLSX from "xlsx";
import { makeStyles } from "@mui/styles";
import { useDropzone } from "react-dropzone";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FormularioConStepper from "./stepper";

import { FormContent } from "Style/Tab/styled";
import { useSelector } from "react-redux";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { collection, getDocs } from "firebase/firestore";
const useStyles = makeStyles({
  tableContainer: {
    maxHeight: "500px",
    borderRadius: "15px",
    overflowX: "auto",
    boxShadow: "5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff",
    backgroundColor: "red",
  },
  tableHeader: {
    backgroundColor: "#f0f0f3",
    color: "#6c63ff",
    fontWeight: "bold",
    fontSize: "1rem",
    textAlign: "center",
    boxShadow: "inset 3px 3px 5px #d1d9e6, inset -3px -3px 5px #ffffff",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  tableRow: {
    boxShadow: "3px 3px 5px #d1d9e6, -3px -3px 5px #ffffff",
  },

  selectedRow: {
    backgroundColor: "#c9e9fa",
  },
  tableCell: {
    fontSize: "0.875rem",
    textAlign: "center",
    padding: "12px",
    minWidth: "150px",
    backgroundColor: "transparent",
    boxShadow: "inset 3px 3px 5px #d1d9e6, inset -3px -3px 5px #ffffff",
    borderBottom: "none",
  },
  repeatedCell: {
    backgroundColor: "#ffedeb",
    color: "#d32f2f",
    fontWeight: "bold",
    boxShadow: "inset 3px 3px 5px #d1d9e6, inset -3px -3px 5px #ffffff",
  },
});

// Componente para la cabecera de columna arrastrable
const DraggableHeader = ({
  header,
  index,
  moveHeader,
  sortColumn,
  sortOrder,
  onSort,
  selectedColumns,
  handleCheckboxChange,
}) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: "column",
    hover(item) {
      if (selectedColumns[header] && item.index !== index) {
        moveHeader(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "column",
    item: { header, index },
    canDrag: selectedColumns[header], // Activa o desactiva el arrastre según el estado del checkbox
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  if (selectedColumns[header]) {
    drag(drop(ref)); // Aplica drag y drop si el checkbox está marcado
  } else {
    drop(ref); // Aplica solo drop cuando el checkbox está desmarcado
  }

  return (
    <TableCell
      ref={ref}
      sx={{
        textAlign: "center",
        backgroundColor: "#f0f0f3", // Color de fondo similar al usado en la imagen
        // Bordes redondeados
        boxShadow: "inset 4px 4px 8px #c6cace, inset -4px -4px 8px #ffffff", // Sombra interna
        padding: "8px", // Espacio alrededor del contenido
      }}
      className="draggable-column"
      style={{
        display: "flex",
        alignItems: "center",
        opacity: isDragging ? 0.5 : 1,
        cursor: selectedColumns[header] ? "move" : "default", // Cambia el cursor según el estado del checkbox
        pointerEvents: selectedColumns[header] ? "auto" : "none", // Desactiva los eventos de la celda, pero no del checkbox
      }}
    >
      <input
        type="checkbox"
        checked={selectedColumns[header]}
        onChange={() => handleCheckboxChange(header)}
        style={{
          marginRight: "5px",
          pointerEvents: "auto", // Asegura que el checkbox siempre sea interactivo
        }}
      />
      <TableSortLabel
        active={selectedColumns[header] && sortColumn === header} // Activa la ordenación solo si el checkbox está marcado
        direction={sortColumn === header ? sortOrder : "asc"}
        onClick={() => selectedColumns[header] && onSort(header)} // Permite ordenar solo si el checkbox está marcado
      >
        {header}
      </TableSortLabel>
    </TableCell>
  );
};

const ExcelTable = () => {
  const classes = useStyles();
  const [fileData, setFileData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [title, setTitle] = useState(""); // Estado para el título
  const [formValues, setFormValues] = useState({
    precio: "",
    stock: "",
    "precio venta": "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [loading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortColumn, setSortColumn] = useState("");
  const [selectedColumns, setSelectedColumns] = useState({});
  const [columnOrder, setColumnOrder] = useState([]); // Para manejar el orden de las columnas
  const customization = useSelector((state) => state.customization);

  const [selectedRowIndex, setSelectedRowIndex] = useState(null); // Estado para la fila seleccionada

  const handleRowClick = (rowIndex) => {
    setSelectedRowIndex(rowIndex); // Establece la fila seleccionada
  };
  // Función para inicializar IndexedDB
  const initDB = async () => {
    const db = await openDB("ExcelDataDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("data")) {
          db.createObjectStore("data", { keyPath: "id", autoIncrement: true });
        }
      },
    });
    return db;
  };

  // Función para guardar datos en IndexedDB
  const saveDataToIndexedDB = async (data, title) => {
    const db = await initDB();
    const tx = db.transaction("data", "readwrite");
    const store = tx.objectStore("data");
    await store.clear(); // Limpiar datos anteriores antes de agregar nuevos

    // Guardar los datos y el título juntos
    const toStore = { id: 1, title, data };
    await store.put(toStore);

    await tx.done;
    console.log("Data and title saved to IndexedDB");
  };

  // Cargar los datos desde IndexedDB al iniciar
  const loadDataFromIndexedDB = async () => {
    const db = await initDB();
    const tx = db.transaction("data", "readonly");
    const store = tx.objectStore("data");
    const storedData = await store.get(1); // Recuperar el título y los datos guardados

    if (storedData) {
      const { title, data } = storedData;
      setTitle(title); // Establecer el título recuperado
      setFileData(data); // Establecer los datos recuperados

      if (data.length > 0) {
        const validHeaders = Object.keys(data[0]).filter(
          (header) => !header.includes("__EMPTY")
        );
        setHeaders(validHeaders);
        setColumnOrder(validHeaders);

        const initialSelectedColumns = validHeaders.reduce((acc, header) => {
          acc[header] = true; // Mostrar todas las columnas por defecto
          return acc;
        }, {});
        setSelectedColumns(initialSelectedColumns);
      }
    }
  };

  useEffect(() => {
    loadDataFromIndexedDB();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reinicia la página cuando cambias la cantidad de filas por página
  };

  const handleFileUpload = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const { data } = results;
          const validHeaders = Object.keys(data[0]);
          setHeaders(validHeaders);
          setFileData(data);
          setColumnOrder(validHeaders);

          const initialSelectedColumns = validHeaders.reduce((acc, header) => {
            acc[header] = true; // Mostrar todas las columnas por defecto
            return acc;
          }, {});
          setSelectedColumns(initialSelectedColumns);

          // Guardar los datos en IndexedDB
          saveDataToIndexedDB(data, "Título CSV");
        },
      });
    } else {
      // Manejar archivos Excel como antes
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });
        if (jsonData.length > 0) {
          const title = jsonData[0][0] || "Título no disponible";
          const validHeaders = jsonData[1]
            ? jsonData[1].filter(
                (header) =>
                  typeof header === "string" &&
                  header &&
                  !header.includes("__EMPTY")
              )
            : [];
          const productData = jsonData.slice(2).map((row) => {
            const filteredRow = {};
            validHeaders.forEach((header, index) => {
              filteredRow[header] = row[index] || "";
            });
            return filteredRow;
          });

          setHeaders(validHeaders);
          setFileData(productData);
          setTitle(title);
          setColumnOrder(validHeaders);

          const initialSelectedColumns = validHeaders.reduce((acc, header) => {
            acc[header] = true;
            return acc;
          }, {});
          setSelectedColumns(initialSelectedColumns);

          saveDataToIndexedDB(productData, title);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    onDrop: (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        setSnackbarMessage("Solo se permiten archivos Excel (.xlsx, .xls)");
        setSnackbarOpen(true);
      } else {
        handleFileUpload(acceptedFiles);
      }
    },
  });

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSort = (header) => {
    const isAsc = sortColumn === header && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortColumn(header);

    const sortedData = [...fileData].sort((a, b) => {
      if (isAsc) {
        return a[header]?.toString().localeCompare(b[header]?.toString());
      } else {
        return b[header]?.toString().localeCompare(a[header]?.toString());
      }
    });

    setFileData(sortedData);
  };

  // Detección de valores repetidos en una columna
  const isColumnRepeated = (header) => {
    const firstValue = fileData[0]?.[header];
    return fileData.every((row) => row[header] === firstValue);
  };

  useEffect(() => {
    const loadInitialState = async () => {
      await loadDataFromIndexedDB();

      // Cargar el estado de selectedColumns desde localStorage
      const savedSelectedColumns = localStorage.getItem("selectedColumns");
      let columnsState = {};

      if (savedSelectedColumns) {
        columnsState = JSON.parse(savedSelectedColumns);
        setSelectedColumns(columnsState);
      } else if (headers.length > 0) {
        // Inicializar con todas las columnas visibles si no hay nada en localStorage
        columnsState = headers.reduce((acc, header) => {
          acc[header] = true;
          return acc;
        }, {});
        setSelectedColumns(columnsState);
      }

      // Reordenar columnOrder para mover las columnas desactivadas al final
      const reorderedColumns = headers.sort((a, b) => {
        if (columnsState[a] === columnsState[b]) {
          return 0; // Mantener el orden original si ambos están activados o desactivados
        }
        return columnsState[a] ? -1 : 1; // Las activadas van al principio, las desactivadas al final
      });

      setColumnOrder(reorderedColumns);
    };

    loadInitialState();
  }, [headers]);

  const handleCheckboxChange = (header) => {
    setSelectedColumns((prev) => {
      const updatedColumns = {
        ...prev,
        [header]: !prev[header],
      };

      // Guardar en localStorage
      localStorage.setItem("selectedColumns", JSON.stringify(updatedColumns));

      return updatedColumns;
    });
  };

  const handleCopyToClipboard = (header) => {
    navigator.clipboard
      .writeText(header)
      .then(() => {
        setSnackbarMessage(
          `El nombre de la columna "${header}" ha sido copiado`
        );
        setSnackbarOpen(true);
      })
      .catch(() => {
        setSnackbarMessage("Error al copiar");
        setSnackbarOpen(true);
      });
  };
  const handleInputChange = (header, value) => {
    setFormValues((prevValues) => ({ ...prevValues, [header]: value }));

    // Verificar si el campo modificado es 'Cod_Prod' o 'Num_RegSan'
    if (header === "Cod_Prod" || header === "Num_RegSan") {
      const matchingData = fileData.find((row) => {
        if (header === "Cod_Prod") {
          return (
            row.Cod_Prod && row.Cod_Prod.toString() === value.toString().trim()
          );
        }
        if (header === "Num_RegSan") {
          return (
            row.Num_RegSan &&
            row.Num_RegSan.toString() === value.toString().trim()
          );
        }
        return false;
      });

      if (matchingData) {
        const updatedValues = { ...formValues, ...matchingData };
        setFormValues(updatedValues);
        setSnackbarMessage("Datos completados automáticamente");
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage("No se encontró un registro correspondiente");
        setSnackbarOpen(true);
      }
    }
  };

  const moveHeader = (fromIndex, toIndex) => {
    const updatedOrder = [...columnOrder];
    const [movedHeader] = updatedOrder.splice(fromIndex, 1);
    updatedOrder.splice(toIndex, 0, movedHeader);
    setColumnOrder(updatedOrder);
  };
  // Cambia esto para almacenar términos de búsqueda por columna

  const handleColumnSearchChange = (header, value) => {
    setSearchTerm((prev) => ({
      ...prev,
      [header]: value,
    }));
  };

  const filteredData = fileData.filter((row) => {
    return columnOrder.every((header) => {
      // Si no hay término de búsqueda para una columna, no filtra por esa columna
      if (!searchTerm[header]) return true;
      return row[header]
        ?.toString()
        .toLowerCase()
        .includes(searchTerm[header].toLowerCase());
    });
  });

  const [verificationStatus, setVerificationStatus] = useState({});

  // Función para verificar un producto en Firestore
  const checkProductInFirestore = async () => {
    const productsCollection = collection(db, "Product");
    const querySnapshot = await getDocs(productsCollection);
    const products = querySnapshot.docs.map((doc) => doc.data());
    const statusMap = {};

    fileData.forEach((row) => {
      if (row.Cod_Prod) {
        statusMap[row.Cod_Prod] = products.some(
          (product) => product.Cod_Prod === row.Cod_Prod
        );
      }
    });

    setVerificationStatus(statusMap);
  };

  useEffect(() => {
    checkProductInFirestore();
  }, [fileData]);
  const sortedData = [...filteredData].sort((a, b) => {
    const aVerified = verificationStatus[a.Cod_Prod] || false;
    const bVerified = verificationStatus[b.Cod_Prod] || false;

    return bVerified - aVerified; // Coloca los verificados (true) primero
  });

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getCodProdOptionsByNumRegSan = (numRegSan) => {
    return fileData
      .filter((row) => row.Num_RegSan === numRegSan)
      .map((row) => row.Cod_Prod)
      .filter((value, index, self) => self.indexOf(value) === index); // Filtra valores únicos
  };
  const handleHoverCodProd = (codProd) => {
    const matchingData = fileData.find(
      (row) =>
        row.Cod_Prod && row.Cod_Prod.toString() === codProd.toString().trim()
    );

    if (matchingData) {
      setFormValues((prevValues) => ({
        ...prevValues,
        ...matchingData,
      }));
    }
  };

  return (
    <FormContent
      $darkMode={customization.darkMode}
      style={{ marginTop: "20px" }}
    >
      <DndProvider backend={HTML5Backend}>
        {title && (
          <h1 style={{ textAlign: "center", margin: "20px 0" }}>{title}</h1>
        )}

        <div>
          <div {...getRootProps({ className: classes.dropzone })}>
            <input {...getInputProps()} />
            <p>
              Suelta tu archivo aquí, o haz clic para seleccionar (solo archivos
              Excel)
            </p>
          </div>

          {loading && (
            <div style={{ margin: "20px 0", textAlign: "center" }}>
              <CircularProgress />
              <p>Procesando datos...</p>
            </div>
          )}
          {/* Formulario dinámico */}
          {headers.length > 0 && formValues && (
            <>
              <FormularioConStepper
                headers={headers}
                formValues={formValues}
                handleInputChange={handleInputChange}
                selectedColumns={selectedColumns} // Pasa selectedColumns como prop
                // Pasa selectedColumns como prop
                codProdOptions={getCodProdOptionsByNumRegSan(
                  formValues["Num_RegSan"]
                )}
                onHoverCodProd={handleHoverCodProd}
              />
              {console.log("FormularioConStepper se ha renderizado")}
            </>
          )}
          {/* Mostrar el título */}
          <Card>
            <CardContent>
              {/* Lista de columnas con checkbox y botón de copiar */}

              {/* Tabla de datos */}
              {!loading && fileData.length > 0 && (
                <>
                  <TableContainer
                    component={Paper}
                    className={classes.tableContainer}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell className={classes.tableHeader}>
                            #
                          </TableCell>
                          <TableCell className={classes.tableHeader}>
                            Estado
                          </TableCell>
                          {columnOrder.map((header, index) => (
                            <TableCell
                              key={header}
                              className={classes.tableHeader}
                            >
                              <DraggableHeader
                                header={header}
                                index={index}
                                moveHeader={moveHeader}
                                sortColumn={sortColumn}
                                sortOrder={sortOrder}
                                onSort={handleSort}
                                selectedColumns={selectedColumns}
                                handleCheckboxChange={handleCheckboxChange}
                              />
                              <TextField
                                variant="outlined"
                                placeholder={`Buscar en ${header}`}
                                value={searchTerm[header] || ""}
                                onChange={(e) =>
                                  handleColumnSearchChange(
                                    header,
                                    e.target.value
                                  )
                                }
                                style={{ marginTop: "10px", width: "100%" }}
                                InputProps={{
                                  endAdornment: searchTerm[header] ? (
                                    <InputAdornment position="end">
                                      <ClearIcon
                                        onClick={() =>
                                          handleColumnSearchChange(header, "")
                                        } // Limpia el término de búsqueda
                                        style={{ cursor: "pointer" }}
                                      />
                                    </InputAdornment>
                                  ) : null,
                                }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {paginatedData.map((row, rowIndex) => (
                          <TableRow
                            key={rowIndex}
                            onClick={() => handleRowClick(rowIndex)}
                            className={classes.tableRow}
                            style={{
                              backgroundColor: verificationStatus[
                                row["Cod_Prod"]
                              ]
                                ? "#d4f7d4" // Color verde claro para filas verificadas
                                : selectedRowIndex === rowIndex
                                ? "#f1f1fe" // Color de fondo para la fila seleccionada
                                : "#f0f0f3", // Color de fondo por defecto del neumorfismo
                              cursor: "pointer",
                              boxShadow: verificationStatus[row["Cod_Prod"]]
                                ? "inset 3px 3px 5px #a3d4a3, inset -3px -3px 5px #ffffff"
                                : "3px 3px 5px #d1d9e6, -3px -3px 5px #ffffff",
                            }}
                          >
                            <TableCell className={classes.tableCell}>
                              {page * rowsPerPage + rowIndex + 1}
                            </TableCell>

                            {/* Celda para el ícono de verificación */}
                            <TableCell className={classes.tableCell}>
                              {verificationStatus[row["Cod_Prod"]] !==
                                undefined &&
                                (verificationStatus[row["Cod_Prod"]] ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Tooltip title="Guardado" arrow>
                                      <CheckCircleIcon
                                        style={{
                                          color: "green",
                                          marginRight: "5px",
                                        }}
                                      />
                                    </Tooltip>
                                    <Chip
                                      label="Inventario"
                                      style={{
                                        backgroundColor: "green",
                                        color: "white",
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <DoNotDisturbOnIcon
                                      style={{
                                        color: "orange",
                                        marginRight: "5px",
                                        cursor: "none  ",
                                      }}
                                    />

                                    <Tooltip title="No en inventario" arrow>
                                      <Chip
                                        label="Digemid"
                                        style={{
                                          backgroundColor: "orange",
                                          color: "white",
                                        }}
                                      />
                                    </Tooltip>
                                  </div>
                                ))}
                            </TableCell>

                            {columnOrder.map((header, colIndex) => (
                              <TableCell
                                key={colIndex}
                                className={
                                  isColumnRepeated(header)
                                    ? classes.repeatedCell
                                    : classes.tableCell
                                }
                                style={{
                                  filter: selectedColumns[header]
                                    ? "none"
                                    : "blur(6px)", // Aplica un blur a las celdas desactivadas
                                }}
                              >
                                {header === "Cod_Prod" ? (
                                  <>
                                    {row[header]}
                                    <ContentCopyIcon
                                      onClick={() =>
                                        handleCopyToClipboard(row[header])
                                      }
                                    />
                                  </>
                                ) : (
                                  row[header]
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={filteredData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[20, 50, 100]}
                    labelRowsPerPage="Filas por página"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity="success"
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </div>
      </DndProvider>
    </FormContent>
  );
};

export default ExcelTable;
