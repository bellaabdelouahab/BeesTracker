// How each hive measurement is named, coloured and explained.
export const METRICS = {
  temperature: { key: 'temperature', label: 'Brood temperature', short: 'Temp', unit: '°C', color: '#cf4a0c', decimals: 1, help: 'Temperature inside the hive. Bees hold the brood nest around 34-35 °C; a cold nest means a weak or broodless colony.' },
  humidity: { key: 'humidity', label: 'Humidity', short: 'Humidity', unit: '%', color: '#1f6fb2', decimals: 0, help: 'Relative humidity inside the hive. Ripening nectar is dry at night and damp by day; persistent high values call for ventilation.' },
  weight: { key: 'weight', label: 'Hive weight', short: 'Weight', unit: 'kg', color: '#b87800', decimals: 1, help: 'Total hive weight. A steady climb is a honey flow; a sudden drop of a few kilos is a swarm or robbing.' },
  activity: { key: 'activity', label: 'Entrance traffic', short: 'Traffic', unit: '/min', color: '#3d7a3a', decimals: 0, help: 'Bees crossing the entrance per minute. Zero at night, peaking during the foraging window at midday.' },
  sound: { key: 'sound', label: 'Hum frequency', short: 'Hum', unit: 'Hz', color: '#6a43c2', decimals: 0, help: 'Dominant frequency of the colony hum. About 230-260 Hz is calm; above 340 Hz can announce a swarm.' },
  battery: { key: 'battery', label: 'Battery', short: 'Battery', unit: 'V', color: '#766f60', decimals: 2, help: 'Voltage of the sensor battery, topped up by a small solar cell. Under 3.5 V the unit may stop reporting.' },
};
export const CHART_METRICS = ['weight', 'temperature', 'humidity', 'activity', 'sound', 'battery'];

export const STATUS = {
  online: { label: 'Healthy', tone: 'ok' },
  warning: { label: 'Warning', tone: 'warn' },
  critical: { label: 'Critical', tone: 'crit' },
  offline: { label: 'Offline', tone: 'off' },
};
export const STATUS_COLOR = { online: '#3d7a3a', warning: '#c87600', critical: '#b3301c', offline: '#766f60' };

export const ALERT_TYPES = {
  temp_high: { label: 'Temperature above limit', rule: 'Brood temperature over the hive maximum. Critical 3 °C above.' },
  temp_low: { label: 'Temperature below limit', rule: 'Brood temperature under the hive minimum. Critical 4 °C below.' },
  humidity_high: { label: 'Humidity above limit', rule: 'Humidity over the hive maximum.' },
  humidity_low: { label: 'Humidity below limit', rule: 'Humidity under the hive minimum.' },
  weight_high: { label: 'Weight above limit', rule: 'Hive heavier than its maximum: time to harvest or add space.' },
  weight_low: { label: 'Weight below limit', rule: 'Hive lighter than its minimum: stores may be running out.' },
  weight_drop: { label: 'Sudden weight loss', rule: '1.5 kg or more lost within 30 minutes: swarm or robbing.' },
  swarm_risk: { label: 'Swarming signature', rule: 'Hum above 340 Hz while the nest is hot.' },
  lid_open: { label: 'Lid open', rule: 'The lid has been open for 10 minutes or more.' },
  battery_low: { label: 'Low battery', rule: 'Battery under 3.5 V. Critical under 3.3 V.' },
  offline: { label: 'Hive offline', rule: 'No reading received for several minutes.' },
};
