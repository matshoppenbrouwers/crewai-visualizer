import { EdgeProps, getBezierPath } from 'reactflow'
import { PopUp } from './PopUp'

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 12 }}
            startOffset="50%"
            textAnchor="middle"
            className="fill-foreground"
          >
            {data.label}
          </textPath>
        </text>
      )}
      {data?.messages && data.messages.length > 0 && (
        <foreignObject
          width={300}
          height={300}
          x={labelX - 150}
          y={labelY - 150}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <PopUp messages={data.messages} />
        </foreignObject>
      )}
    </>
  )
} 