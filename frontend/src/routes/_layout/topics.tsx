import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
  Button,
  Text
} from "@chakra-ui/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"
import {
  ThesisService,
  ThesisApplicationService,
  type ThesisTopicPublic,
  UsersService,
  type UserPublic,
  type UsersReadUsersData,
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

function getThesisQueryOptions({ page }: { page: number }) {
  return {
    queryFn: async () => {
      const thesisData = await ThesisService.readThesisTopics({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      })

      return {
        data: thesisData.data,
      }
    },
    queryKey: ["thesis-topics", { page }],
  }
}

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

  const { data: promoters } = useQuery({
    queryKey: ["promoters"],
    queryFn: () => UsersService.readUsers({} as UsersReadUsersData),
    select: (data) =>
      data.data.filter((user: UserPublic) => user.role === "promoter"),
  })

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getThesisQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const { data: applications } = useQuery({
    queryKey: ["thesis-applications"],
    queryFn: () => ThesisApplicationService.readThesisApplicationsStudent(),
    enabled: true,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })
  
  const { showSuccessToast } = useCustomToast()
  const applyMutation = useMutation({
    mutationFn: (thesisId: string) =>
      ThesisApplicationService.createThesisApplicationStudent({
        requestBody: {
          thesis_topic_id: thesisId,
        },
      }),
    onSuccess: () => {
      showSuccessToast("Successfully applied to the thesis topic.")
      queryClient.invalidateQueries({ queryKey: ["thesis-applications"] })
    },
    onError: (error) => {
      useCustomToast().showErrorToast((error as any)?.body?.message || "Something went wrong.")
    },
  })


  const theses = (data?.data || []) as ThesisTopicPublic[]
  const count = theses.length

  if (isLoading) {
    return <PendingItems />
  }

  if (theses.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>Brak dostępnych tematów prac dyplomowych</EmptyState.Title>
            <EmptyState.Description>
              Dodaj nowy temat pracy dyplomowej, aby zacząć
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Tytuł</Table.ColumnHeader>
            <Table.ColumnHeader>Etap studiów</Table.ColumnHeader>
            <Table.ColumnHeader>Miejsca (Wszystkie/Dostępne)</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Promotor</Table.ColumnHeader>
            <Table.ColumnHeader>Język</Table.ColumnHeader>
            <Table.ColumnHeader>Wydział</Table.ColumnHeader>
            <Table.ColumnHeader>Utworzono</Table.ColumnHeader>
            <Table.ColumnHeader>Zaktualizowano</Table.ColumnHeader>
            <Table.ColumnHeader>Akcje</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {theses.map((thesis) => {
            const hasApplied = applications?.data.some(
              (app) => app.thesis_topic.id === thesis.id
            )
            return (
            <Table.Row key={thesis.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell>{thesis.title}</Table.Cell>
              <Table.Cell>{capitalize(thesis.target_study_stage)}</Table.Cell>
              <Table.Cell>
                {thesis.slots_total} / {thesis.slots_available}
              </Table.Cell>
              <Table.Cell>{capitalize(thesis.status)}</Table.Cell>
              <Table.Cell>
                {
                  promoters?.find((user) => user.id === thesis.promoter_id)
                    ?.full_name ?? "N/A"
                }
              </Table.Cell>
              <Table.Cell>{thesis.language || "N/A"}</Table.Cell>
              <Table.Cell>{thesis.department || "N/A"}</Table.Cell>
              <Table.Cell>
                {new Date(thesis.created_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                {new Date(thesis.updated_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <Flex direction="column" align="start" gap={1}>
                  <Button
                    colorScheme="teal"
                    size="sm"
                    disabled={
                      thesis.status === "closed" ||
                      thesis.slots_available === 0 ||
                      hasApplied
                    }
                    onClick={() => {
                      applyMutation.mutate(thesis.id);
                    }}
                  >
                    Aplikuj
                  </Button>
                  {(thesis.status === "closed" ||
                    thesis.slots_available === 0 ||
                    hasApplied) && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {thesis.status === "closed"
                        ? "Ten temat jest zamknięty."
                        : thesis.slots_available === 0
                        ? "Brak dostępnych miejsc."
                        : "Już zgłosiłeś się na ten temat."}
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
          count={count}
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
