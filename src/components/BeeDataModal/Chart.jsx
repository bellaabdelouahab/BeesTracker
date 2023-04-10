import React from 'react'

//react apex chart
import ReactApexChart from 'react-apexcharts'

const Chart = () => {
    const data = {
          
        series: [{
        name: 'Témperateure °C' ,
          data: [31, 40, 28, 51, 42, 109, 100]
        }, {
          name: 'Humidité %',
          data: [11, 32, 45, 32, 34, 52, 41]
        },
        {
            name: 'Weight kg',
            data: [10, 12, 15, 31, 21, 12, 42]
          }],
        options: {
          chart: {
            height: 350,
            type: 'area'
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          xaxis: {
            type: 'datetime',
            categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
          },
          tooltip: {
            x: {
              format: 'dd/MM/yy HH:mm'
            },
          },
        },
      
      
      };
    
  return (
    <div>
        <ReactApexChart options={data.options} series={data.series} type="area" height={350} />
    </div>
  )
}

export default Chart