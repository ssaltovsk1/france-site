(function () {
  const palette = {
    bread: "#2f78d0",
    hunger: "#c94c4c",
    money: "#2f8f61",
    warning: "#d89a35",
    purple: "#8a5fb4",
    dark: "#222832",
    grid: "#d6dce6"
  };

  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    canvas.height = Math.max(220, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function drawLineChart(canvas, config) {
    const { ctx, width, height } = fitCanvas(canvas);
    const margin = { top: 22, right: 18, bottom: 34, left: 46 };
    const plotW = Math.max(10, width - margin.left - margin.right);
    const plotH = Math.max(10, height - margin.top - margin.bottom);
    const series = config.series.filter((item) => item.values.length);
    const xValues = config.labels;
    const allValues = series.flatMap((item) => item.values);
    const minY = config.minY ?? Math.min(0, ...allValues);
    const maxY = config.maxY ?? Math.max(1, ...allValues);
    const rangeY = maxY - minY || 1;
    const stepX = xValues.length > 1 ? plotW / (xValues.length - 1) : plotW;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.font = "600 14px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = palette.dark;
    ctx.fillText(config.title, margin.left, 16);

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.font = "11px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "#667085";

    for (let i = 0; i <= 4; i += 1) {
      const y = margin.top + plotH * i / 4;
      const value = maxY - rangeY * i / 4;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();
      ctx.fillText(Math.round(value).toString(), 8, y + 4);
    }

    xValues.forEach((label, index) => {
      if (index % Math.ceil(xValues.length / 6) !== 0 && index !== xValues.length - 1) {
        return;
      }
      const x = margin.left + stepX * index;
      ctx.fillText(label, x - 6, height - 10);
    });

    series.forEach((item) => {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width || 2.5;
      ctx.beginPath();
      item.values.forEach((value, index) => {
        const x = margin.left + stepX * index;
        const y = margin.top + plotH - ((value - minY) / rangeY) * plotH;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });

    let legendX = margin.left;
    const legendY = height - 27;
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    series.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY - 8, 14, 3);
      ctx.fillStyle = palette.dark;
      ctx.fillText(item.name, legendX + 18, legendY - 4);
      legendX += ctx.measureText(item.name).width + 42;
    });
  }

  function drawGroupBars(canvas, groups) {
    const { ctx, width, height } = fitCanvas(canvas);
    const margin = { top: 28, right: 18, bottom: 52, left: 46 };
    const plotW = Math.max(10, width - margin.left - margin.right);
    const plotH = Math.max(10, height - margin.top - margin.bottom);
    const maxValue = Math.max(1, ...groups.map((group) => Math.max(group.wealthPerPlayer, 0)));
    const barW = plotW / groups.length * 0.58;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.font = "600 14px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = palette.dark;
    ctx.fillText("Богатство групп к финалу", margin.left, 17);

    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    groups.forEach((group, index) => {
      const x = margin.left + (plotW / groups.length) * index + (plotW / groups.length - barW) / 2;
      const h = Math.max(0, group.wealthPerPlayer) / maxValue * plotH;
      const y = margin.top + plotH - h;
      ctx.fillStyle = group.color || palette.purple;
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = palette.dark;
      ctx.font = "600 12px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(group.wealthPerPlayer.toString(), x, y - 6);
      ctx.save();
      ctx.translate(x + barW / 2, height - 12);
      ctx.rotate(-0.42);
      ctx.font = "11px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(group.name, 0, 0);
      ctx.restore();
    });
  }

  window.ResourceCharts = {
    drawLineChart,
    drawGroupBars,
    palette
  };
})();
