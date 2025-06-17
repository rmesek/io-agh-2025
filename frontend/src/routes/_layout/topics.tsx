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
import ThesisFilters from "@/components/Thesis/ThesisFilters"
import { useState, useMemo } from "react"

const PER_PAGE = 5

const thesisSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/topics")({
  component: Thesis,
  validateSearch: (search) => thesisSearchSchema.parse(search),
})

function capitalize(text?: string | null) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Brak"
}

type FilterState = {
  promoters: string[]
  languages: string[]
  departments: string[]
  availablePlacesMin?: number
  stage?: "bachelor" | "master" | "any"
  status?: "open" | "closed"
}

function ThesisTable({ filters }: { filters: FilterState | null }) {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Fetch all promoters
  const { data: promoters } = useQuery({
    queryKey: ["promoters"],
    queryFn: () => UsersService.readUsers({}),
    select: (data) => data.data.filter((user: UserPublic) => user.role === "promoter"),
  })

  // Fetch all thesis topics (without pagination to allow filtering and pagination client-side)
  // If data is too big, consider server-side filtering or pagination API changes
  const { data: allTheses, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["thesis-topics"],
    queryFn: () => ThesisService.readThesisTopics({ skip: 0, limit: 1000 }), // fetch max 1000 to avoid overload
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

  // Filtrujemy dane po stronie klienta
  const filteredTheses = useMemo(() => {
    if (!allTheses?.data) return []

    return allTheses.data.filter((thesis) => {
      if (filters == null) return true

      // Promotorzy
      if (filters.promoters.length > 0 && !filters.promoters.includes(thesis.promoter_id)) return false

      // Języki
      if (filters.languages.length > 0 && !filters.languages.includes(thesis.language || "")) return false

      // Wydział
      if (filters.departments.length > 0 && !filters.departments.includes(thesis.department || "")) return false

      // Minimalna liczba dostępnych miejsc
      if (filters.availablePlacesMin !== undefined && thesis.slots_available < filters.availablePlacesMin) return false

      // Etap
      if (filters.stage && filters.stage !== "any" && thesis.target_study_stage !== filters.stage) return false

      // Status
      if (filters.status && thesis.status !== filters.status) return false

      return true
    })
  }, [allTheses, filters])

  // Obcinamy dane do aktualnej strony
  const pagedTheses = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return filteredTheses.slice(start, start + PER_PAGE)
  }, [filteredTheses, page])

  if (isLoading) return <PendingItems />

  if (!pagedTheses.length) {
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
          {pagedTheses.map((thesis) => {
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
                  {promoters?.find((p) => p.id === thesis.promoter_id)?.full_name || "Brak"}
                </Table.Cell>
                <Table.Cell>{thesis.language || "Brak"}</Table.Cell>
                <Table.Cell>{thesis.department || "Brak"}</Table.Cell>
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
                          ? "Już zgłoszono"
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
          count={filteredTheses.length}
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
  const [filters, setFilters] = useState<FilterState | null>(null)
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const setPage = (page: number) => navigate({ search: () => ({ page }) })

  return (
    <Container maxW="full" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Tematy prac dyplomowych</Heading>
        <Flex gap={2}>
          <ThesisFilters
            onApplyFilters={(filters) => {
              setFilters(filters)
              setPage(1)
            }}
          />
        </Flex>
      </Flex>
      <ThesisTable filters={filters} />
    </Container>
  )
}

export default Thesis