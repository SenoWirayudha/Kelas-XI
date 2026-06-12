import { Group } from 'react-konva'

export default function FrameSlot({ clipFunc, listening, children }) {
  return (
    <Group clipFunc={clipFunc} listening={listening}>
      {children}
    </Group>
  )
}
