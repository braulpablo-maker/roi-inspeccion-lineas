let lastScenario = null; // para el guardado

function num(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? 0 : v;
}

function formatUSD(value) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  });
}

function formatNumber(value, decimals = 2) {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function calcularROI() {
  // 1. Alcance
  const L_KM_OBJ_ANIO = num("targetLengthKm");

  // 2. Actual (cuadrilla)
  const KM_ACT_MES = num("crewKmPerMonth");
  const C_CUAD_MES = num("crewMonthlyCost");
  const F_CUAD_REMAN = num("crewResidualFraction");

  // 3. Nueva (drone)
  const KM_DRONE_MES = num("droneKmPerMonth");
  const C_DRONE_MES = num("droneMonthlyCost");
  const OPEX_ADIC = num("extraOpexAnnual");

  // 4. Fiabilidad / fallas
  const DEV_CRIT_KM = num("deviationsPerKmPerYear");
  const P_ESCAL_ACT_PCT = num("pEscalationCurrentPercent");
  const VOL_PERDIDO_M3_FALLA = num("volLostPerFailureM3");
  const P_OIL_USD_BBL = num("oilPricePerBbl");
  const MARGEN_VTA_PCT = num("marginOnSales");
  const C_REPAR_FIJA = num("repairCostPerFailure");

  // Conversión bbl -> m3 (1 m3 ≈ 6.2898 bbl)
  const P_OIL_USD_M3 = P_OIL_USD_BBL * 6.2898;
  const MARGEN_VTA = MARGEN_VTA_PCT / 100;

  // 5. Inversión y ajustes
  const CAPEX = num("capex");
  const IMPL = num("implementationCost");
  const F_RIESGO = num("riskFactor");
  const F_ADOP = num("adoptionFactor");

  // ============================
  // COSTOS OPERATIVOS
  // ============================
  const MESES_CUAD_ACT = KM_ACT_MES > 0 ? (L_KM_OBJ_ANIO / KM_ACT_MES) : 0;
  const MESES_DRONE = KM_DRONE_MES > 0 ? (L_KM_OBJ_ANIO / KM_DRONE_MES) : 0;

  const COSTO_ACT_ANUAL = MESES_CUAD_ACT * C_CUAD_MES;
  const COSTO_DRONE_ANUAL = MESES_DRONE * C_DRONE_MES;
  const COSTO_CUAD_REMAN = MESES_CUAD_ACT * C_CUAD_MES * F_CUAD_REMAN;

  const COSTO_NUEVO_ANUAL = COSTO_DRONE_ANUAL + COSTO_CUAD_REMAN + OPEX_ADIC;

  let AH_OPER = COSTO_ACT_ANUAL - COSTO_NUEVO_ANUAL;
  AH_OPER = Math.round(AH_OPER);

  // ============================
  // FIABILIDAD / FALLAS
  // ============================
  const DEV_TOT_EXIST = L_KM_OBJ_ANIO * DEV_CRIT_KM;

  const P_ESCAL_ACT = P_ESCAL_ACT_PCT / 100;
  let P_ESCAL_DRONE;

  // Probabilidad con drone según relación de velocidades km/mes
  if (KM_ACT_MES > 0 && KM_DRONE_MES > 0) {
    P_ESCAL_DRONE = P_ESCAL_ACT * (KM_ACT_MES / KM_DRONE_MES);
    if (P_ESCAL_DRONE > P_ESCAL_ACT) {
      P_ESCAL_DRONE = P_ESCAL_ACT;
    }
  } else {
    P_ESCAL_DRONE = P_ESCAL_ACT;
  }

  const F_FALLAS_ACT = DEV_TOT_EXIST * P_ESCAL_ACT;
  const F_FALLAS_DRONE = DEV_TOT_EXIST * P_ESCAL_DRONE;

  const ING_BRUTO_FALLA = VOL_PERDIDO_M3_FALLA * P_OIL_USD_M3;
  const UTIL_PERDIDA_FALLA = ING_BRUTO_FALLA * MARGEN_VTA;
  const C_FALLA = UTIL_PERDIDA_FALLA + C_REPAR_FIJA;

  const C_FALLAS_ACT_ANUAL = F_FALLAS_ACT * C_FALLA;
  const C_FALLAS_DRONE_ANUAL = F_FALLAS_DRONE * C_FALLA;

  const AH_FALLAS = C_FALLAS_ACT_ANUAL - C_FALLAS_DRONE_ANUAL;

  // ============================
  // BENEFICIO Y ROI
  // ============================
  const BEN_TOT_1A = AH_OPER + AH_FALLAS;
  const BEN_NETO_1A = BEN_TOT_1A;

  const INV_TOTAL = CAPEX + IMPL;

  const ROI_1A_BASE = INV_TOTAL > 0 ? (BEN_NETO_1A / INV_TOTAL) : 0;
  const ROI_1A_AJUST = ROI_1A_BASE * F_RIESGO * F_ADOP;

  let PAYBACK = null;
  if (BEN_NETO_1A > 0) {
    PAYBACK = INV_TOTAL / BEN_NETO_1A;
  }

  // Guardar escenario para el botón de guardado
  lastScenario = {
    L_KM_OBJ_ANIO,
    KM_ACT_MES,
    C_CUAD_MES,
    F_CUAD_REMAN,
    KM_DRONE_MES,
    C_DRONE_MES,
    OPEX_ADIC,
    DEV_CRIT_KM,
    P_ESCAL_ACT_PCT,
    VOL_PERDIDO_M3_FALLA,
    P_OIL_USD_BBL,
    P_OIL_USD_M3,
    MARGEN_VTA_PCT,
    C_REPAR_FIJA,
    CAPEX,
    IMPL,
    F_RIESGO,
    F_ADOP,
    MESES_CUAD_ACT,
    MESES_DRONE,
    COSTO_ACT_ANUAL,
    COSTO_DRONE_ANUAL,
    COSTO_CUAD_REMAN,
    COSTO_NUEVO_ANUAL,
    AH_OPER,
    DEV_TOT_EXIST,
    F_FALLAS_ACT,
    F_FALLAS_DRONE,
    C_FALLAS_ACT_ANUAL,
    C_FALLAS_DRONE_ANUAL,
    AH_FALLAS,
    BEN_NETO_1A,
    INV_TOTAL,
    ROI_1A_BASE,
    ROI_1A_AJUST,
    PAYBACK
  };

  // ============================
  // MOSTRAR RESULTADOS
  // ============================
  const resultsDiv = document.getElementById("resultsContent");

  resultsDiv.innerHTML = `
    <div class="result-row" title="MES_CUAD_ACT = L_KM_OBJ_AÑO / KM_ACT_MES"><span>Meses de cuadrilla (actual):</span><strong>${formatNumber(MESES_CUAD_ACT)}</strong></div>
    <div class="result-row" title="MES_DRONE = L_KM_OBJ_AÑO / KM_DRONE_MES"><span>Meses de drone (nuevo):</span><strong>${formatNumber(MESES_DRONE)}</strong></div>
    <div class="result-row" title="COSTO_ACT_ANUAL = MES_CUAD_ACT × C_CUAD_MES"><span>Costo anual actual (solo cuadrilla):</span><strong>US$ ${Math.round(COSTO_ACT_ANUAL).toLocaleString("es-AR")}</strong></div>
    <div class="result-row" title="COSTO_NUEVO_ANUAL = COSTO_DRONE_ANUAL + COSTO_CUAD_REMAN + OPEX_ADIC"><span>Costo anual nuevo (drone + cuadrilla remanente + OPEX):</span><strong>US$ ${Math.round(COSTO_NUEVO_ANUAL).toLocaleString("es-AR")}</strong></div>
    <div class="result-row" title="AH_OPER = COSTO_ACT_ANUAL - COSTO_NUEVO_ANUAL"><span>Ahorro operativo anual (AH_OPER):</span><strong>US$ ${Math.round(AH_OPER).toLocaleString("es-AR")}</strong></div>

    <div class="highlight">
      <div class="result-row" title="DEV_TOT_EXIST = L_KM_OBJ_AÑO × DEV_CRIT_KM"><span>Desvíos críticos totales/año (DEV_TOT_EXIST):</span><strong>${formatNumber(DEV_TOT_EXIST)}</strong></div>
      <div class="result-row" title="F_FALLAS_ACT = DEV_TOT_EXIST × P_ESCAL_ACT"><span>Fallas graves/año (escenario actual):</span><strong>${formatNumber(F_FALLAS_ACT)}</strong></div>
      <div class="result-row" title="F_FALLAS_DRONE = DEV_TOT_EXIST × P_ESCAL_DRONE"><span>Fallas graves/año (con drone):</span><strong>${formatNumber(F_FALLAS_DRONE)}</strong></div>
      <div class="result-row" title="C_FALLAS_ACT_ANUAL = F_FALLAS_ACT × C_FALLA"><span>Costo anual de fallas (actual):</span><strong>US$ ${Math.round(C_FALLAS_ACT_ANUAL).toLocaleString("es-AR")}</strong></div>
      <div class="result-row" title="C_FALLAS_DRONE_ANUAL = F_FALLAS_DRONE × C_FALLA"><span>Costo anual de fallas (con drone):</span><strong>US$ ${Math.round(C_FALLAS_DRONE_ANUAL).toLocaleString("es-AR")}</strong></div>
      <div class="result-row" title="AH_FALLAS = C_FALLAS_ACT_ANUAL - C_FALLAS_DRONE_ANUAL"><span>Ahorro anual por fallas evitadas (AH_FALLAS):</span><strong>US$ ${Math.round(AH_FALLAS).toLocaleString("es-AR")}</strong></div>
    </div>

    <div class="highlight">
      <div class="result-row" title="BEN_NETO_1A = AH_OPER + AH_FALLAS"><span>Beneficio neto anual (BEN_NETO_1A):</span><strong>US$ ${Math.round(BEN_NETO_1A).toLocaleString("es-AR")}</strong></div>
      <div class="result-row" title="INV_TOTAL = CAPEX + IMPL"><span>Inversión total (CAPEX + IMPL):</span><strong>US$ ${Math.round(INV_TOTAL).toLocaleString("es-AR")}</strong></div>
      <div class="result-row" title="ROI_1A_BASE = BEN_NETO_1A / INV_TOTAL"><span>ROI Año 1 (base):</span><strong>${Math.round(ROI_1A_BASE * 100)} %</strong></div>
      <div class="result-row" title="ROI_1A_AJUST = ROI_1A_BASE × F_RIESGO × F_ADOP"><span>ROI Año 1 ajustado (riesgo × adopción):</span><strong>${Math.round(ROI_1A_AJUST * 100)} %</strong></div>
      <div class="result-row" title="PAYBACK = INV_TOTAL / BEN_NETO_1A"><span>Payback (años):</span><strong>${PAYBACK ? formatNumber(PAYBACK, 2) : "No se recupera (BEN_NETO_1A ≤ 0)"}</strong></div>
    </div>
  `;
}

function guardarInputsLocal() {
  const inputs = {
    targetLengthKm: num("targetLengthKm"),
    crewKmPerMonth: num("crewKmPerMonth"),
    crewMonthlyCost: num("crewMonthlyCost"),
    crewResidualFraction: num("crewResidualFraction"),
    droneKmPerMonth: num("droneKmPerMonth"),
    droneMonthlyCost: num("droneMonthlyCost"),
    extraOpexAnnual: num("extraOpexAnnual"),
    deviationsPerKmPerYear: num("deviationsPerKmPerYear"),
    pEscalationCurrentPercent: num("pEscalationCurrentPercent"),
    volLostPerFailureM3: num("volLostPerFailureM3"),
    oilPricePerBbl: num("oilPricePerBbl"),
    marginOnSales: num("marginOnSales"),
    repairCostPerFailure: num("repairCostPerFailure"),
    capex: num("capex"),
    implementationCost: num("implementationCost"),
    riskFactor: num("riskFactor"),
    adoptionFactor: num("adoptionFactor")
  };
  localStorage.setItem("roiInputs", JSON.stringify(inputs));
  alert("Inputs guardados localmente en el navegador.");
}

function cargarInputsLocal() {
  const saved = localStorage.getItem("roiInputs");
  if (saved) {
    const inputs = JSON.parse(saved);
    document.getElementById("targetLengthKm").value = inputs.targetLengthKm;
    document.getElementById("crewKmPerMonth").value = inputs.crewKmPerMonth;
    document.getElementById("crewMonthlyCost").value = inputs.crewMonthlyCost;
    document.getElementById("crewResidualFraction").value = inputs.crewResidualFraction;
    document.getElementById("droneKmPerMonth").value = inputs.droneKmPerMonth;
    document.getElementById("droneMonthlyCost").value = inputs.droneMonthlyCost;
    document.getElementById("extraOpexAnnual").value = inputs.extraOpexAnnual;
    document.getElementById("deviationsPerKmPerYear").value = inputs.deviationsPerKmPerYear;
    document.getElementById("pEscalationCurrentPercent").value = inputs.pEscalationCurrentPercent;
    document.getElementById("volLostPerFailureM3").value = inputs.volLostPerFailureM3;
    document.getElementById("oilPricePerBbl").value = inputs.oilPricePerBbl;
    document.getElementById("marginOnSales").value = inputs.marginOnSales;
    document.getElementById("repairCostPerFailure").value = inputs.repairCostPerFailure;
    document.getElementById("capex").value = inputs.capex;
    document.getElementById("implementationCost").value = inputs.implementationCost;
    document.getElementById("riskFactor").value = inputs.riskFactor;
    document.getElementById("adoptionFactor").value = inputs.adoptionFactor;
    alert("Inputs cargados desde almacenamiento local.");
  } else {
    alert("No hay inputs guardados localmente.");
  }
}

function guardarInputs() {
  const inputs = [
    ["Variable", "Valor"],
    ["L_KM_OBJ_AÑO", num("targetLengthKm")],
    ["KM_ACT_MES", num("crewKmPerMonth")],
    ["C_CUAD_MES", num("crewMonthlyCost")],
    ["F_CUAD_REMAN", num("crewResidualFraction")],
    ["KM_DRONE_MES", num("droneKmPerMonth")],
    ["C_DRONE_MES", num("droneMonthlyCost")],
    ["OPEX_ADIC", num("extraOpexAnnual")],
    ["DEV_CRIT_KM", num("deviationsPerKmPerYear")],
    ["P_ESCAL_ACT_%", num("pEscalationCurrentPercent")],
    ["VOL_PERDIDO_M3_FALLA", num("volLostPerFailureM3")],
    ["P_OIL_USD_BBL", num("oilPricePerBbl")],
    ["MARGEN_VTA_%", num("marginOnSales")],
    ["C_REPAR_FIJA", num("repairCostPerFailure")],
    ["CAPEX", num("capex")],
    ["IMPL", num("implementationCost")],
    ["F_RIESGO", num("riskFactor")],
    ["F_ADOP", num("adoptionFactor")]
  ];

  const csvContent = inputs.map(r => r.join(";")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `inputs_roi_inspeccion_lineas_${fecha}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarPDF() {
  if (!lastScenario) {
    alert("Primero calcule el ROI antes de exportar el PDF.");
    return;
  }

  if (!window.jspdf) {
    alert("Error: Biblioteca jsPDF no cargada. Verifique la conexión a internet.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const s = lastScenario;

  // Colors (consistent with the app's new theme)
  const primaryColor = "#4f46e5"; // Indigo
  const textColor = "#111827"; // Dark blue-gray
  const lightTextColor = "#6b7280"; // Medium gray
  const backgroundColor = "#ffffff"; // White
  const headerColor = "#ffffff";

  const currency = (value) => `US$ ${Math.round(value).toLocaleString("es-AR")}`;
  const percent = (value) => `${Math.round(value * 100)} %`;

  // Register Inter font if available (assuming it's loaded in the HTML)
  // jsPDF has issues with custom fonts, so we'll stick to helvetica but use the style.
  
  // --- Header ---
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(headerColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Calculadora de ROI", margin, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Inspección de Líneas de Alta / Media Tensión", margin, 22);
  
  let y = 40;

  // --- Summary Cards ---
  const summaryData = [
    { label: "Ahorro Operativo Anual", value: currency(s.AH_OPER) },
    { label: "Ahorro por Fallas Evitadas", value: currency(s.AH_FALLAS) },
    { label: "Beneficio Neto (Año 1)", value: currency(s.BEN_NETO_1A) },
    { label: "ROI (Año 1)", value: percent(s.ROI_1A_BASE) },
  ];

  const cardWidth = (contentWidth - 15) / 4;
  summaryData.forEach((item, index) => {
    const cardX = margin + index * (cardWidth + 5);
    doc.setFillColor(backgroundColor);
    doc.setDrawColor("#e5e7eb"); // Light gray border
    doc.roundedRect(cardX, y, cardWidth, 25, 3, 3, "FD");
    
    doc.setFontSize(8);
    doc.setTextColor(lightTextColor);
    doc.text(item.label, cardX + 5, y + 10);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor);
    doc.text(item.value, cardX + 5, y + 18);
    doc.setFont("helvetica", "normal");
  });
  
  y += 35;

  // --- Key Parameters ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textColor);
  doc.text("Parámetros Clave", margin, y);
  y += 7;

  const params = [
    { label: "Longitud inspeccionada/año", value: `${formatNumber(s.L_KM_OBJ_ANIO, 0)} km` },
    { label: "Km/mes cuadrilla", value: `${formatNumber(s.KM_ACT_MES)} km` },
    { label: "Costo mensual cuadrilla", value: currency(s.C_CUAD_MES) },
    { label: "Km/mes drone", value: `${formatNumber(s.KM_DRONE_MES, 0)} km` },
    { label: "Desvíos críticos/km/año", value: formatNumber(s.DEV_CRIT_KM) },
    { label: "Prob. escalamiento actual", value: `${formatNumber(s.P_ESCAL_ACT_PCT)} %` },
    { label: "CAPEX inicial", value: currency(s.CAPEX) },
    { label: "Implementación (IMPL)", value: currency(s.IMPL) },
  ];

  doc.setFontSize(9);
  doc.setTextColor(lightTextColor);
  
  let paramY = y;
  const half = Math.ceil(params.length / 2);
  const col1 = params.slice(0, half);
  const col2 = params.slice(half);
  
  col1.forEach(p => {
    doc.text(p.label, margin, paramY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor);
    doc.text(p.value, margin + 60, paramY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightTextColor);
    paramY += 6;
  });

  paramY = y;
  col2.forEach(p => {
    doc.text(p.label, margin + contentWidth / 2, paramY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor);
    doc.text(p.value, margin + contentWidth / 2 + 60, paramY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightTextColor);
    paramY += 6;
  });

  y = paramY + 5;


  // --- Main Content ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textColor);
  doc.text("Resultados Detallados", margin, y);
  y += 8;

  const drawSection = (title, data) => {
    doc.setFillColor("#f3f4f6"); // Lighter gray background
    doc.setDrawColor("#e5e7eb");
    doc.roundedRect(margin, y, contentWidth, 7 + data.length * 8, 3, 3, "FD");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text(title, margin + 5, y + 7);
    y += 12;

    data.forEach(item => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(lightTextColor);
      doc.text(item.label, margin + 5, y);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(textColor);
      doc.text(item.value, margin + contentWidth - 5, y, { align: "right" });
      y += 8;
    });
    y += 5; // Extra space between sections
  };

  const costosData = [
    { label: "Costo Anual Actual (Cuadrilla)", value: currency(s.COSTO_ACT_ANUAL) },
    { label: "Costo Anual Nuevo (Drone + Remanente)", value: currency(s.COSTO_NUEVO_ANUAL) },
    { label: "Ahorro Operativo Anual", value: currency(s.AH_OPER) },
  ];
  drawSection("Costos Operativos", costosData);

  const fiabilidadData = [
    { label: "Fallas Graves por Año (Actual)", value: formatNumber(s.F_FALLAS_ACT) },
    { label: "Fallas Graves por Año (con Drone)", value: formatNumber(s.F_FALLAS_DRONE) },
    { label: "Costo Anual de Fallas (Actual)", value: currency(s.C_FALLAS_ACT_ANUAL) },
    { label: "Costo Anual de Fallas (con Drone)", value: currency(s.C_FALLAS_DRONE_ANUAL) },
    { label: "Ahorro por Fallas Evitadas", value: currency(s.AH_FALLAS) },
  ];
  drawSection("Fiabilidad y Fallas", fiabilidadData);

  const roiData = [
    { label: "Beneficio Neto Anual (Año 1)", value: currency(s.BEN_NETO_1A) },
    { label: "Inversión Total (CAPEX + IMPL)", value: currency(s.INV_TOTAL) },
    { label: "ROI Año 1 (Base)", value: percent(s.ROI_1A_BASE) },
    { label: "ROI Año 1 (Ajustado por Riesgo y Adopción)", value: percent(s.ROI_1A_AJUST) },
    { label: "Payback (Años)", value: s.PAYBACK ? formatNumber(s.PAYBACK, 2) : "No se recupera" },
  ];
  drawSection("Análisis de ROI", roiData);

  // --- Footer ---
  const footerY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setTextColor(lightTextColor);
  const fecha = new Date().toISOString().slice(0, 10);
  doc.text(`Reporte generado el ${fecha}`, margin, footerY);
  doc.text("© 2025 Pablo Braul | ROI Drone Inspection", pageWidth - margin, footerY, { align: "right" });

  doc.save(`roi_inspeccion_lineas_${fecha}.pdf`);
}
