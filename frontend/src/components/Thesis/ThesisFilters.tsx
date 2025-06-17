import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Button,
  VStack,
  Text,
  Input,
  HStack,
} from "@chakra-ui/react"
import { Checkbox } from "../ui/checkbox"
import { Radio, RadioGroup } from "../ui/radio"

import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "../ui/dialog"

import { UsersService, ThesisService } from "@/client"
import type { UsersReadUsersData, ThesisTopicPublic, UserPublic } from "@/client"

type FilterState = {
  promoters: string[]
  languages: string[]
  departments: string[]
  availablePlacesMin?: number
  stage?: "bachelor" | "master" | "any"
  status?: "open" | "closed"
}

const ThesisFilters = ({
  onApplyFilters,
}: {
  onApplyFilters: (filters: FilterState) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    promoters: [],
    languages: [],
    departments: [],
    availablePlacesMin: undefined,
    stage: undefined,
    status: undefined,
  })

  const { data: allTheses } = useQuery({
    queryKey: ["all-theses"],
    queryFn: () => ThesisService.readThesisTopics({}),
  })

  const { data: allUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => UsersService.readUsers({} as UsersReadUsersData),
  })

  const promoters: UserPublic[] =
    (allUsers?.data.filter((u) => u.role === "promoter") || []).sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    )

  const languages = Array.from(
    new Set(
      (allTheses?.data || [])
        .map((t: ThesisTopicPublic) => t.language)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))

  const departments = Array.from(
    new Set(
      (allTheses?.data || [])
        .map((t: ThesisTopicPublic) => t.department)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))

  const toggleValue = (field: keyof FilterState, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[field] as string[] | undefined
      if (!current) return prev
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  const applyFilters = () => {
    onApplyFilters(selectedFilters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setSelectedFilters({
      promoters: [],
      languages: [],
      departments: [],
      availablePlacesMin: undefined,
      stage: undefined,
      status: undefined,
    })
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button>Filtruj</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtruj tematy prac</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch">
            {/* Etap */}
            <div>
              <Text fontWeight="bold" mb={2}>
                Etap
              </Text>
              <RadioGroup
                value={selectedFilters.stage}
                onChange={(event) => {
                  const val = (event.target as HTMLInputElement)
                    .value as FilterState["stage"]
                  setSelectedFilters((prev) => ({
                    ...prev,
                    stage: val,
                  }))
                }}
              >
                <HStack>
                  <Radio value="bachelor">I stopień</Radio>
                  <Radio value="master">II stopień</Radio>
                  <Radio value="any">Dowolny</Radio>
                </HStack>
              </RadioGroup>
            </div>

            {/* Status */}
            <div>
              <Text fontWeight="bold" mb={2}>
                Status
              </Text>
              <RadioGroup
                value={selectedFilters.status}
                onChange={(event) => {
                  const val = (event.target as HTMLInputElement)
                    .value as FilterState["status"]
                  setSelectedFilters((prev) => ({
                    ...prev,
                    status: val,
                  }))
                }}
              >
                <HStack>
                  <Radio value="open">Otwarte</Radio>
                  <Radio value="closed">Zamknięte</Radio>
                </HStack>
              </RadioGroup>
            </div>

            {/* Języki */}
            <div>
              <Text fontWeight="bold" mb={2}>
                Języki
              </Text>
              <VStack align="stretch" maxH="110px" overflowY="auto">
                {languages.map((lang) => (
                  <Checkbox
                    key={lang}
                    value={lang}
                    checked={selectedFilters.languages.includes(lang)}
                    onChange={() => toggleValue("languages", lang)}
                  >
                    {lang}
                  </Checkbox>
                ))}
              </VStack>
            </div>

            {/* Wydziały */}
            <div>
              <Text fontWeight="bold" mb={2}>
                Wydziały
              </Text>
              <VStack align="stretch" maxH="110px" overflowY="auto">
                {departments.map((dep) => (
                  <Checkbox
                    key={dep}
                    value={dep}
                    checked={selectedFilters.departments.includes(dep)}
                    onChange={() => toggleValue("departments", dep)}
                  >
                    {dep}
                  </Checkbox>
                ))}
              </VStack>
            </div>

            {/* Promotorzy */}
            <div>
              <Text fontWeight="bold" mb={2}>
                Promotorzy
              </Text>
              <VStack align="stretch" maxH="110px" overflowY="auto">
                {promoters.map((promoter) => (
                  <Checkbox
                    key={promoter.id}
                    value={promoter.id}
                    checked={selectedFilters.promoters.includes(promoter.id)}
                    onChange={() => toggleValue("promoters", promoter.id)}
                  >
                    {promoter.full_name}
                  </Checkbox>
                ))}
              </VStack>
            </div>

            {/* Minimalna ilość dostępnych miejsc */}
            <div>
              <Text fontWeight="bold" mb={2}>
                Minimalna ilość dostępnych miejsc
              </Text>
              <Input
                type="number"
                placeholder="np. 3"
                value={selectedFilters.availablePlacesMin ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : Number(e.target.value)
                  setSelectedFilters((prev) => ({
                    ...prev,
                    availablePlacesMin: val,
                  }))
                }}
                maxW="150px"
              />
            </div>
          </VStack>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorScheme="gray">
              Anuluj
            </Button>
          </DialogActionTrigger>
          <Button onClick={clearFilters} variant="outline" colorScheme="red">
            Wyczyść filtry
          </Button>
          <Button onClick={applyFilters} variant="solid">
            Zastosuj
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default ThesisFilters
