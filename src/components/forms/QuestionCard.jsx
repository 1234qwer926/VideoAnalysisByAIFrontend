import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const QUESTION_TYPES = [
  { label: "Long Text", value: "text" },
  { label: "Short Text", value: "short_text" },
  { label: "Single Select", value: "single_select" },
  { label: "Multiple Select", value: "multiple_select" },
  { label: "MCQ", value: "mcq" },
  { label: "Video", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "File Upload", value: "file" },
  { label: "Code", value: "code" },
]

function usesOptions(type) {
  return ["single_select", "multiple_select", "mcq", "select"].includes(type)
}

export default function QuestionCard({
  question,
  index,
  totalQuestions,
  onChange,
  onDelete,
  onMove,
}) {
  const options = Array.isArray(question.options) ? question.options : []

  const updateOption = (optionIndex, value) => {
    const nextOptions = [...options]
    nextOptions[optionIndex] = value
    onChange(question.id, "options", nextOptions)
  }

  const addOption = () => {
    onChange(question.id, "options", [...options, ""])
  }

  const removeOption = (optionIndex) => {
    const nextOptions = options.filter((_, index) => index !== optionIndex)
    onChange(question.id, "options", nextOptions)
  }

  const handleTypeChange = (value) => {
    const nextType = value
    onChange(question.id, "type", nextType)

    if (!usesOptions(nextType)) {
      onChange(question.id, "options", [])
    } else if (!options.length) {
      onChange(question.id, "options", ["", ""])
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            <CardDescription>
              Configure the question content, response type, and requirement.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMove(question.id, "up")}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMove(question.id, "down")}
              disabled={index === totalQuestions - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(question.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Question Title</Label>
          <Input
            placeholder="e.g. Explain your React project experience"
            value={question.title || ""}
            onChange={(e) => onChange(question.id, "title", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Prompt</Label>
          <Textarea
            rows={4}
            placeholder="Add detailed instructions for the candidate..."
            value={question.prompt || ""}
            onChange={(e) => onChange(question.id, "prompt", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Question Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={question.type || "text"}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Section</Label>
          <Input
            placeholder="e.g. Aptitude, Technical, HR"
            value={question.section || ""}
            onChange={(e) => onChange(question.id, "section", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Section Timer (seconds)</Label>
          <Input
            type="number"
            min="0"
            placeholder="0 = no section limit"
            value={question.section_time_seconds || ""}
            onChange={(e) =>
              onChange(question.id, "section_time_seconds", e.target.value)
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Required</p>
            <p className="text-xs text-muted-foreground">
              Candidate must answer this question.
            </p>
          </div>

          <Switch
            checked={Boolean(question.required)}
            onCheckedChange={(checked) =>
              onChange(question.id, "required", checked)
            }
          />
        </div>

        {usesOptions(question.type) ? (
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>

            <div className="space-y-3">
              {options.length > 0 ? (
                options.map((option, optionIndex) => (
                  <div
                    key={`${question.id}-option-${optionIndex}`}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(optionIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No options added yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
