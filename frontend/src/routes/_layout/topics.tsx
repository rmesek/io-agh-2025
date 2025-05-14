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
import PendingItems from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const thesisSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

function getThesisQueryOptions({ page }: { page: number }) {
  return {
    queryFn: async () => {
      const [thesisData, usersData] = await Promise.all([
        ThesisService.readThesisTopics({
          skip: (page - 1) * PER_PAGE,
          limit: PER_PAGE,
        }),
        UsersService.readUsers({} as UsersReadUsersData),
      ])

      const promoters = usersData.data.filter((user: UserPublic) => user.role === "promoter")

      const thesesWithPromoters = thesisData.data.map((thesis) => {
        const promotor = promoters.find((user) => user.id === thesis.promoter_id)

        return {
          ...thesis,
          promoter: promotor ? promotor : null, 
        }
      })

      return {
        data: thesesWithPromoters,
        total: thesisData.length, 
      }
    },
    queryKey: ["thesis-topics", { page }],
  }
}

export const Route = createFileRoute("/_layout/topics")({
  component: Thesis,
  validateSearch: (search) => thesisSearchSchema.parse(search),
})

function ThesisTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getThesisQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
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
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Study Stage</Table.ColumnHeader>
            <Table.ColumnHeader>Slots (Total/Avail)</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Promoter</Table.ColumnHeader>
            <Table.ColumnHeader>Created At</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {theses.map((thesis) => (
            <Table.Row key={thesis.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell>{thesis.title}</Table.Cell>
              <Table.Cell>{thesis.description || "N/A"}</Table.Cell>
              <Table.Cell>{thesis.target_study_stage}</Table.Cell>
              <Table.Cell>
                {thesis.slots_total} / {thesis.slots_available}
              </Table.Cell>
              <Table.Cell>{thesis.status}</Table.Cell>
              <Table.Cell>
                {thesis.promoter ? thesis.promoter.full_name : "N/A"}
              </Table.Cell>
              <Table.Cell>
                {new Date(thesis.created_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <Flex align="center">
                  <Button
                    colorScheme="teal"
                    size="sm"
                    disabled={thesis.status === "closed" || thesis.slots_available === 0}
                    onClick={() => {
                      if (thesis.status === "closed" || thesis.slots_available === 0) {
                        alert("This topic is closed or has no available slots.");
                      } else {
                        alert("You have successfully applied for this thesis topic.");
                      }
                    }}
                  >
                    Apply
                  </Button>
                  {(thesis.status === "closed" || thesis.slots_available === 0) && (
                    <Text color="red" ml={2}>
                      This topic is closed or has no available slots.
                    </Text>
                  )}
                </Flex>
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
        <Heading size="lg">Thesis Topics</Heading>
      </Flex>
      <ThesisTable />
    </Container>
  )
}

export default Thesis
