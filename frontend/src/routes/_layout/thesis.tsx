import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  ThesisService,
  type ThesisTopicPublic,
  UsersService,
  type UserPublic,
  type UsersReadUsersData,
} from "@/client"
import { ThesisActionsMenu } from "@/components/Common/ThesisActionsMenu"
import PendingItems from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import AddThesis from "@/components/Thesis/AddThesis"

const thesisSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

function getThesisQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ThesisService.readThesisTopics({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    queryKey: ["thesis-topics", { page }],
  }
}

export const Route = createFileRoute("/_layout/thesis")({
  component: Thesis,
  validateSearch: (search) => thesisSearchSchema.parse(search),
})

function capitalize(text?: string | null) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "N/A"
}

function ThesisTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

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

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const theses = (data?.data || []) as ThesisTopicPublic[]
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const currentUserId = currentUser?.id

  const filteredTheses = theses.filter(
    (thesis) => thesis.promoter_id === currentUserId
  )

  const count = filteredTheses.length

  if (isLoading) {
    return <PendingItems />
  }

  if (filteredTheses.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No thesis topics found</EmptyState.Title>
            <EmptyState.Description>
              Add a new thesis topic to get started
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
            <Table.ColumnHeader>Title</Table.ColumnHeader>
            <Table.ColumnHeader>Study Stage</Table.ColumnHeader>
            <Table.ColumnHeader>Slots (Total/Avail)</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Promoter</Table.ColumnHeader>
            <Table.ColumnHeader>Language</Table.ColumnHeader>
            <Table.ColumnHeader>Department</Table.ColumnHeader>
            <Table.ColumnHeader>Created At</Table.ColumnHeader>
            <Table.ColumnHeader>Updated At</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredTheses.map((thesis) => (
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
                <ThesisActionsMenu thesis={thesis} />
              </Table.Cell>
            </Table.Row>
          ))}
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
        <Heading size="lg">Thesis Topics Management</Heading>
        <AddThesis />
      </Flex>
      <ThesisTable />
    </Container>
  )
}

export default Thesis
