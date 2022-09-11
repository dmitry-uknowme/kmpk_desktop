import { useMemo } from "react";
import { AxisOptions, Chart } from "react-charts";

const Graph = ({ graphData }) => {
  console.log("ggggg", graphData);
  const data = [
    {
      label: "H2",
      data: [...graphData],
      // data: [{ primary: 0, secondary: 0 }, ...graphData],
    },
  ];

  const primaryAxis = useMemo<AxisOptions<typeof data[number]["data"][number]>>(
    () => ({
      getValue: (datum) => datum.primary,
    }),
    []
  );

  const secondaryAxes = useMemo<
    AxisOptions<typeof data[number]["data"][number]>[]
  >(
    () => [
      {
        getValue: (datum) => datum.secondary,
      },
    ],
    []
  );

  return (
    <div
      style={{
        width: "400px",
        height: "300px",
      }}
    >
      <Chart options={{ data, primaryAxis, secondaryAxes }} />
    </div>
  );
};
export default Graph;
