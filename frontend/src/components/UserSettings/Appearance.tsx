import { Container, Heading, Stack } from "@chakra-ui/react"
import { useTheme } from "next-themes"

import { Radio, RadioGroup } from "@/components/ui/radio"

const Appearance = () => {
  const { theme, setTheme } = useTheme()

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        Wygląd
      </Heading>

      <RadioGroup
        onValueChange={(e) => setTheme(e.value)}
        value={theme}
        colorPalette="teal"
      >
        <Stack>
          <Radio value="system">Systemowy</Radio>
          <Radio value="light">Tryb jasny</Radio>
          <Radio value="dark">Tryb ciemny</Radio>
        </Stack>
      </RadioGroup>
    </Container>
  )
}

export default Appearance
