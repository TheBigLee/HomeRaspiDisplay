# Swiss Transport Dashboard

A real-time departure board for Swiss public transport with integrated Grafana dashboards.

## Features

- Real-time departure information from Swiss transport stations
- Official VBZ/ZVV line colors for trams and S-Bahn
- Delay information in red
- Kiosk mode for full-screen display
- Embedded Grafana dashboards
- Live clock display

## Docker Usage

### Build the image

```bash
docker build -t swiss-transport-dashboard .
```

### Run with default settings

```bash
docker run -p 8080:8080 swiss-transport-dashboard
```

### Run with custom stations and Grafana URLs

```bash
docker run -p 8080:8080 \
  -e STATIONS="Zürich HB,Bern" \
  -e GRAFANA_URL_1="https://your-grafana.com/d-solo/dashboard1" \
  -e GRAFANA_URL_2="https://your-grafana.com/d-solo/dashboard2" \
  swiss-transport-dashboard
```

### Environment Variables

- `STATIONS` - Comma-separated list of station names (default: "Zürich HB")
- `GRAFANA_URL_1` - URL for the first Grafana dashboard
- `GRAFANA_URL_2` - URL for the second Grafana dashboard

### Access the dashboard

- Main dashboard: http://localhost:8080/dashboard.html
- Standalone departure board: http://localhost:8080/index.html

### Dashboard URL Parameters

You can override the station configuration via URL parameters:

```
http://localhost:8080/dashboard.html?stations=Zürich HB,Bern
```

or using the short form:

```
http://localhost:8080/dashboard.html?s=Zürich HB,Bern
```

This overrides the `STATIONS` environment variable for that specific view.

## Security Features

- Runs as non-root user (UID 1001)
- Uses nginx:alpine for minimal image size
- Exposes non-privileged port 8080

## URL Parameters

### Standalone Mode

- `?kiosk` or `?k` - Enable kiosk mode (hides configuration UI)
- `?stations=Station1,Station2` or `?s=Station1,Station2` - Load specific stations

Example: `http://localhost:8080/index.html?kiosk&stations=Zürich HB,Bern`

## Line Colors

The application uses official colors from:
- VBZ network map for Zurich tram lines
- ZVV network map for S-Bahn lines
- Standard blue for buses (#7FC6E1)
