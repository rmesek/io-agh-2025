


import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ThesisService, ThesisApplicationService, UsersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { ThesisActionsMenu } from "@/components/Common/ThesisActionsMenu"
import { translateStage, translateStatus } from "@/labels"
export const Route = createFileRoute("/_layout/$id")({
  component: ThesisDetails,
})

function ThesisDetails() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const currentUser = queryClient.getQueryData(["currentUser"]) as { id: string; role: string }

  const { data: thesis } = useQuery({
    queryKey: ["thesis-topic", id],
    queryFn: () => ThesisService.readThesisTopic({ id }),
  })

  const { data: applications } = useQuery({
    queryKey: ["thesis-applications"],
    queryFn: () => ThesisApplicationService.readThesisApplicationsStudent(),
    enabled: currentUser?.role === "student",
  })

  const { data: promoters } = useQuery({
    queryKey: ["promoters"],
    queryFn: () => UsersService.readUsers({}),
    select: (data) => data.data.filter((u) => u.role === "promoter"),
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      ThesisApplicationService.createThesisApplicationStudent({
        requestBody: { thesis_topic_id: id },
      }),
    onSuccess: () => {
      showSuccessToast("Pomyślnie zaaplikowano.")
      queryClient.invalidateQueries({ queryKey: ["thesis-applications"] })
    },
    onError: (error) => {
      showErrorToast((error as any)?.body?.message || "Coś poszło nie tak.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => ThesisService.deleteThesisTopic({ id }),
    onSuccess: () => {
      showSuccessToast("Temat został usunięty.")
      queryClient.invalidateQueries({ queryKey: ["thesis-topics"] })
      navigate({ to: "/thesis" })
    },
    onError: (error) => {
      showErrorToast((error as any)?.body?.message || "Nie udało się usunąć tematu.")
    },
  })

  const hasApplied = applications?.data.some(
    (app) => app.thesis_topic.id === thesis?.id
  )
  const isClosed = thesis?.status === "closed" || thesis?.slots_available === 0
  const promoter =
    promoters?.find((u) => u.id === thesis?.promoter_id)?.full_name ?? "N/A"

  if (!thesis) return <Text>Ładowanie...</Text>

  const isPromoter = currentUser?.role === "promoter" && currentUser?.id === thesis.promoter_id
  const isStudent = currentUser?.role === "student"

  return (
    <Container maxW="6xl" py={8}>
      <Box borderWidth="1px" borderRadius="xl" p={8} boxShadow="md">
        <Heading size="2xl" mb={6}>
          {thesis.title}
        </Heading>

        <Flex direction={{ base: "column", md: "row" }} gap={10}>
          <VStack align="start" flex={3}>
            <Box width="100%">
              <Text fontWeight="bold" fontSize="lg" mb={2}>
                Opis
              </Text>
              <Text whiteSpace="pre-wrap" fontSize="md" lineHeight="tall">
                {thesis.description || "Brak opisu."}
              </Text>
            </Box>

            <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
              <Info label="Język" value={thesis.language || "N/A"} />
              <Info label="Wydział" value={thesis.department || "N/A"} />
              <Info label="Promotor" value={promoter} />
              <Info label="Etap studiów" value={translateStage(thesis.target_study_stage)} />
            </Grid>
          </VStack>

 <Box flex={1} borderLeft="1px solid" borderColor="gray.200" pl={6}>
  <Stack>
    <Info label="Status" value={translateStatus(thesis.status)} />
    <Info
      label="Sloty"
      value={`${thesis.slots_total} / ${thesis.slots_available}`}
    />
    <Info
      label="Utworzono"
      value={new Date(thesis.created_at).toLocaleDateString()}
    />
    <Info
      label="Zaktualizowano"
      value={new Date(thesis.updated_at).toLocaleDateString()}
    />

    {isPromoter && (
      <GridItem mb={3}>
        <Text fontWeight="semibold" color="gray.600" fontSize="sm">
          Akcje
        </Text>
        <ThesisActionsMenu thesis={thesis} />
      </GridItem>
    )}
  </Stack>

  {isStudent && (
    <Flex mt={8} justify="flex-end">
      <Stack>
        <Button
          colorScheme="teal"
          onClick={() => applyMutation.mutate()}
          disabled={isClosed || hasApplied}
          size="lg"
        >
          Aplikuj
        </Button>
        {(isClosed || hasApplied) && (
          <Text fontSize="sm" color="red.500">
            {isClosed
              ? "Ten temat jest zamknięty lub brak dostępnych miejsc."
              : "Już zgłosiłeś się na ten temat."}
          </Text>
        )}
      </Stack>
    </Flex>
  )}
</Box>
        </Flex>
      </Box>
    </Container>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <GridItem mb={3}>
      <Text fontWeight="semibold" color="gray.600" fontSize="sm">
        {label}
      </Text>
      <Text fontSize="md">{value}</Text>
    </GridItem>
  )
}
