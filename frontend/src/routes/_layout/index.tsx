import {
  Container,
  Heading,
  Text,
  Button,
  Table,
  Flex,
} from "@chakra-ui/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ThesisApplicationService,
  ApplicationStatusEnum,
  PromoterProfileService,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { useState } from "react"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const isStudent = currentUser?.role === "student"
  const isPromoter = currentUser?.role === "promoter"

  const {
    data: promoterProfile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ["promoter-profile"],
    queryFn: () => PromoterProfileService.readPromoterProfile(),
    enabled: isPromoter,
  })

  const queryClient = useQueryClient()

  const PER_PAGE = 5
  const [page, setPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [handledPage, setHandledPage] = useState(1)
  const skip = (page - 1) * PER_PAGE

  const { data, isLoading, error } = useQuery({
    queryKey: ["thesis-applications", currentUser?.id, page],
    queryFn: () => {
      if (isStudent) {
        return ThesisApplicationService.readThesisApplicationsStudent({
          limit: PER_PAGE,
          skip,
        })
      }

      if (isPromoter) {
        return ThesisApplicationService.readThesisApplicationsPromoter({})
      }

      return Promise.resolve({ data: [] })
    },
  })

  if (error) {
    console.error("Error fetching thesis applications:", error)
  }

  const mutationCancel = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      ThesisApplicationService.updateThesisApplicationStudent({
        id,
        query: { application_id: id },
        requestBody: {
          status: ApplicationStatusEnum.CANCELED_BY_STUDENT,
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["thesis-applications"] }),
  })

  const mutationApprove = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      ThesisApplicationService.updateThesisApplicationPromoter({
        id,
        query: { application_id: id },
        requestBody: {
          status: ApplicationStatusEnum.APPROVED_BY_PROMOTER,
          student_message: "",
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["thesis-applications"] }),
  })

  const mutationReject = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      ThesisApplicationService.updateThesisApplicationPromoter({
        id,
        query: { application_id: id },
        requestBody: {
          status: ApplicationStatusEnum.REJECTED_BY_PROMOTER,
          student_message: "",
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["thesis-applications"] }),
  })

  const mutationUndo = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      ThesisApplicationService.updateThesisApplicationPromoter({
        id,
        query: { application_id: id },
        requestBody: {
          status: ApplicationStatusEnum.PENDING_APPROVAL,
          student_message: "",
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["thesis-applications"] }),
  })

  if (isLoading) return <Text>Loading...</Text>

  const statusLabels: Record<string, string> = {
    pending_approval: "Oczekujące",
    approved_by_promoter: "Zaakceptowane",
    rejected_by_promoter: "Odrzucone",
    canceled_by_student: "Anulowane przez studenta",
  }

  const applications = data?.data ?? []
  const count = applications.length

  const pendingApplications = applications.filter(
    (app) => app.status === ApplicationStatusEnum.PENDING_APPROVAL
  )
  const handledApplications = applications.filter(
    (app) =>
      app.status === ApplicationStatusEnum.APPROVED_BY_PROMOTER ||
      app.status === ApplicationStatusEnum.REJECTED_BY_PROMOTER
  )

  const approvedApplications = applications.filter(
    (app) => app.status === ApplicationStatusEnum.APPROVED_BY_PROMOTER
  )

  const acceptedTopicIds = new Set(
    approvedApplications.map((app) => app.thesis_topic.id)
  )

  const acceptedCount = acceptedTopicIds.size
  const topicLimit = promoterProfile?.student_limit ?? 0
  const isLimitReached = topicLimit > 0 && acceptedCount >= topicLimit

  const pendingCount = pendingApplications.length
  const handledCount = handledApplications.length

  const paginatedPending = pendingApplications.slice(
    (pendingPage - 1) * PER_PAGE,
    pendingPage * PER_PAGE
  )
  const paginatedHandled = handledApplications.slice(
    (handledPage - 1) * PER_PAGE,
    handledPage * PER_PAGE
  )

  return (
    <Container maxW="full" py={8}>
      <Heading mb={6}>Twoje zgłoszenia</Heading>

      {isStudent && (
        <>
          {!applications.length ? (
            <Text>Brak zgłoszeń</Text>
          ) : (
            <>
              <Table.Root size={{ base: "sm", md: "md" }}>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Praca</Table.ColumnHeader>
                    <Table.ColumnHeader>Promotor</Table.ColumnHeader>
                    <Table.ColumnHeader>Data</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader></Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {applications.map((application) => (
                    <Table.Row key={application.id}>
                      <Table.Cell>
                        <Link
                          to="/$id"
                          params={{ id: application.thesis_topic?.id ?? "" }}
                        >
                          {application.thesis_topic?.title ?? "N/A"}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        {application.thesis_topic?.promoter?.full_name ?? "-"}
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(application.created_at).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        {statusLabels[application.status] ?? "N/A"}
                      </Table.Cell>
                      <Table.Cell>
                        {application.status !==
                          ApplicationStatusEnum.CANCELED_BY_STUDENT && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() =>
                              mutationCancel.mutate({ id: application.id })
                            }
                          >
                            Anuluj
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              <Flex justifyContent="flex-end" mt={4}>
                <PaginationRoot
                  count={count}
                  pageSize={PER_PAGE}
                  page={page}
                  onPageChange={({ page }) => setPage(page)}
                >
                  <Flex gap={2}>
                    <PaginationPrevTrigger />
                    <PaginationItems />
                    <PaginationNextTrigger />
                  </Flex>
                </PaginationRoot>
              </Flex>
            </>
          )}
        </>
      )}

      {isPromoter && (
        <Flex gap={8} direction="column">
          <Container flex={1} minW="360px">
            <Heading size="md" mb={2}>
              Przyjęte prace: {acceptedCount} / {topicLimit || "Brak limitu"}
            </Heading>
            {isLimitReached && (
              <Text color="red.500" mb={4}>
                Osiągnięto limit przyjętych prac — nie możesz zaakceptować więcej zgłoszeń.
              </Text>
            )}

            <Heading size="md" mb={4}>
              Oczekujące zgłoszenia
            </Heading>

            {paginatedPending.length === 0 ? (
              <Text>Brak oczekujących zgłoszeń</Text>
            ) : (
              <>
                <Table.Root size={{ base: "sm", md: "md" }}>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Praca</Table.ColumnHeader>
                      <Table.ColumnHeader>Student</Table.ColumnHeader>
                      <Table.ColumnHeader>Data</Table.ColumnHeader>
                      <Table.ColumnHeader></Table.ColumnHeader>
                      <Table.ColumnHeader></Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {paginatedPending.map((application) => (
                      <Table.Row key={application.id}>
                        <Table.Cell>
                          <Link
                            to="/$id"
                            params={{ id: application.thesis_topic?.id ?? "" }}
                          >
                            {application.thesis_topic?.title ?? "N/A"}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          {application.student?.full_name ?? "-"}
                        </Table.Cell>
                        <Table.Cell>
                          {new Date(application.created_at).toLocaleDateString()}
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="sm"
                            onClick={() =>
                              mutationApprove.mutate({ id: application.id })
                            }
                            disabled={isLimitReached}
                          >
                            Zaakceptuj
                          </Button>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="sm"
                            onClick={() =>
                              mutationReject.mutate({ id: application.id })
                            }
                          >
                            Odrzuć
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>

                <Flex justifyContent="flex-end" mt={4}>
                  <PaginationRoot
                    count={pendingCount}
                    pageSize={PER_PAGE}
                    page={pendingPage}
                    onPageChange={({ page }) => setPendingPage(page)}
                  >
                    <Flex gap={2}>
                      <PaginationPrevTrigger />
                      <PaginationItems />
                      <PaginationNextTrigger />
                    </Flex>
                  </PaginationRoot>
                </Flex>
              </>
            )}
          </Container>

          <Container flex={1} minW="360px">
            <Heading size="md" mb={4}>
              Pozostałe zgłoszenia
            </Heading>

            {paginatedHandled.length === 0 ? (
              <Text>Brak zatwierdzonych lub odrzuconych zgłoszeń</Text>
            ) : (
              <>
                <Table.Root size={{ base: "sm", md: "md" }}>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Praca</Table.ColumnHeader>
                      <Table.ColumnHeader>Student</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader></Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {paginatedHandled.map((application) => (
                      <Table.Row key={application.id}>
                        <Table.Cell>
                          <Link
                            to="/$id"
                            params={{ id: application.thesis_topic?.id ?? "" }}
                          >
                            {application.thesis_topic?.title ?? "N/A"}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          {application.student?.full_name ?? "-"}
                        </Table.Cell>
                        <Table.Cell>
                          {statusLabels[application.status] ?? "N/A"}
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="sm"
                            onClick={() =>
                              mutationUndo.mutate({ id: application.id })
                            }
                          >
                            Cofnij
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>

                <Flex justifyContent="flex-end" mt={4}>
                  <PaginationRoot
                    count={handledCount}
                    pageSize={PER_PAGE}
                    page={handledPage}
                    onPageChange={({ page }) => setHandledPage(page)}
                  >
                    <Flex gap={2}>
                      <PaginationPrevTrigger />
                      <PaginationItems />
                      <PaginationNextTrigger />
                    </Flex>
                  </PaginationRoot>
                </Flex>
              </>
            )}
          </Container>
        </Flex>
      )}
    </Container>
  )
}
