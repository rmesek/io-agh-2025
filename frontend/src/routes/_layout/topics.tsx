import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
  Button,
  Text,
} from "@chakra-ui/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"
import {
  ThesisService,
  ThesisApplicationService,
  UsersService,
  type UserPublic,
} from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import useCustomToast from "@/hooks/useCustomToast"

const thesisSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

export const Route = createFileRoute("/_layout/topics")({
  component: Thesis,
  validateSearch: (search) => thesisSearchSchema.parse(search),
})

function capitalize(text?: string | null) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "N/A"
}

function ThesisTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: promoters } = useQuery({
    queryKey: ["promoters"],
    queryFn: () => UsersService.readUsers({}),
    select: (data) => data.data.filter((user: UserPublic) => user.role === "promoter"),
  })

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["thesis-topics", { page }],
    queryFn: () =>
      ThesisService.readThesisTopics({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    placeholderData: (prevData) => prevData,
  })

  const { data: applications } = useQuery({
    queryKey: ["thesis-applications"],
    queryFn: () => ThesisApplicationService.readThesisApplicationsStudent(),
  })

  const applyMutation = useMutation({
    mutationFn: (thesisId: string) =>
      ThesisApplicationService.createThesisApplicationStudent({
        requestBody: { thesis_topic_id: thesisId },
      }),
    onSuccess: () => {
      showSuccessToast("Pomyślnie zaaplikowano.")
      queryClient.invalidateQueries({ queryKey: ["thesis-applications"] })
    },
    onError: (error) => {
      showErrorToast((error as any)?.body?.message || "Coś poszło nie tak.")
    },
  })

  const setPage = (page: number) => navigate({ search: () => ({ page }) })

  if (isLoading) return <PendingItems />

  if (!data?.data?.length) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>Brak tematów</EmptyState.Title>
            <EmptyState.Description>Spróbuj ponownie później</EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Tytuł</Table.ColumnHeader>
            <Table.ColumnHeader>Etap</Table.ColumnHeader>
            <Table.ColumnHeader>Miejsca</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Promotor</Table.ColumnHeader>
            <Table.ColumnHeader>Język</Table.ColumnHeader>
            <Table.ColumnHeader>Wydział</Table.ColumnHeader>
            <Table.ColumnHeader>Utworzono</Table.ColumnHeader>
            <Table.ColumnHeader>Akcje</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.data.map((thesis) => {
            const hasApplied = applications?.data.some(
              (app) => app.thesis_topic.id === thesis.id
            )

            return (
              <Table.Row key={thesis.id} opacity={isPlaceholderData ? 0.5 : 1}>
                <Table.Cell>
                  <Link to="/$id" params={{ id: thesis.id }}>
                    {thesis.title}
                  </Link>
                </Table.Cell>
                <Table.Cell>{capitalize(thesis.target_study_stage)}</Table.Cell>
                <Table.Cell>
                  {thesis.slots_total} / {thesis.slots_available}
                </Table.Cell>
                <Table.Cell>{capitalize(thesis.status)}</Table.Cell>
                <Table.Cell>
                  {promoters?.find((p) => p.id === thesis.promoter_id)?.full_name || "N/A"}
                </Table.Cell>
                <Table.Cell>{thesis.language || "N/A"}</Table.Cell>
                <Table.Cell>{thesis.department || "N/A"}</Table.Cell>
                <Table.Cell>{new Date(thesis.created_at).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap={1}>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => applyMutation.mutate(thesis.id)}
                      disabled={
                        thesis.status === "closed" ||
                        thesis.slots_available === 0 ||
                        hasApplied
                      }
                    >
                      Aplikuj
                    </Button>
                    {(thesis.status === "closed" ||
                      thesis.slots_available === 0 ||
                      hasApplied) && (
                      <Text fontSize="sm" color="red.500">
                        {hasApplied
                          ? "Już zgłoszony"
                          : thesis.slots_available === 0
                          ? "Brak miejsc"
                          : "Temat zamknięty"}
                      </Text>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>

      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={data.data.length}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Thesis() {
  return (
    <Container maxW="full" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Tematy prac dyplomowych</Heading>
      </Flex>
      <ThesisTable />
    </Container>
  )
}

export default Thesis
