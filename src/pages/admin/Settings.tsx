import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { StarterContentImport } from "@/components/admin/StarterContentImport";
import { ErrorState, Field, PageHeader, Panel, Spinner, TableSkeleton } from "@/components/admin/ui";
import { useSaveSettingsSection, useStoredSettings } from "@/lib/cms/admin";
import { BUILTIN_IMAGES } from "@/lib/cms/defaults";
import { friendlyError } from "@/lib/cms/errors";
import { mergeSettings } from "@/lib/cms/queries";
import type { SettingsSection, SiteSettings } from "@/lib/cms/types";
import type { MediaFolder } from "@/lib/cms/storage";

// ---------------------------------------------------------------------------
// Field definitions → forms. Each section saves independently (server deep-merge).
// ---------------------------------------------------------------------------

type FieldKind = "text" | "textarea" | "email" | "url" | "image";
interface FieldDef {
  name: string;
  label: string;
  kind?: FieldKind;
  hint?: string;
  rows?: number;
  max?: number;
  required?: boolean;
  fallbackImage?: string;
}

function schemaFor(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let s = z.string().trim().max(f.max ?? (f.kind === "textarea" ? 2000 : 300), `Keep this under ${f.max ?? (f.kind === "textarea" ? 2000 : 300)} characters`);
    if (f.required) s = s.min(1, `${f.label} is required`);
    if (f.kind === "email") {
      shape[f.name] = s.refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address");
    } else if (f.kind === "url") {
      shape[f.name] = s.refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Enter a full link starting with https://");
    } else {
      shape[f.name] = s;
    }
  }
  return z.object(shape);
}

function useDirtyGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}

function SaveBar({ dirty, saving, busy, onReset }: { dirty: boolean; saving: boolean; busy?: boolean; onReset: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t bg-muted/40 px-5 py-3">
      {dirty && <span className="mr-auto text-xs text-muted-foreground">Unsaved changes</span>}
      <Button type="button" variant="ghost" size="sm" disabled={!dirty || saving} onClick={onReset}>
        Discard
      </Button>
      <Button type="submit" size="sm" disabled={!dirty || saving || busy}>
        {saving && <Spinner className="mr-2" />}
        Save
      </Button>
    </div>
  );
}

function SectionForm<S extends SettingsSection>({
  section,
  title,
  description,
  fields,
  values,
  folder = "settings",
}: {
  section: S;
  title: string;
  description?: string;
  fields: FieldDef[];
  values: SiteSettings[S];
  folder?: MediaFolder;
}) {
  const save = useSaveSettingsSection();
  const schema = useMemo(() => schemaFor(fields), [fields]);
  const defaults = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of fields) out[f.name] = String((values as Record<string, unknown>)[f.name] ?? "");
    return out;
  }, [fields, values]);
  const { register, control, handleSubmit, formState, reset } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const [uploading, setUploading] = useState(false);
  useDirtyGuard(formState.isDirty);

  // Reset only when *this section's* saved values actually change (e.g. after saving it),
  // so saving another card never wipes unsaved edits here.
  const savedKey = JSON.stringify(defaults);
  useEffect(() => reset(JSON.parse(savedKey)), [savedKey, reset]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ section, values: { ...(values as object), ...v } as SiteSettings[S] });
      toast.success(`${title} saved`);
    } catch (err) {
      toast.error(friendlyError(err, "Couldn't save these settings."));
    }
  });

  return (
    <Panel>
      <form onSubmit={onSubmit} noValidate>
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          {fields.map((f) => {
            const id = `${section}-${f.name}`;
            const err = formState.errors[f.name]?.message as string | undefined;
            const wide = f.kind === "textarea" || f.kind === "image";
            return (
              <Field key={f.name} id={id} label={f.label} required={f.required} hint={f.hint} error={err} className={wide ? "md:col-span-2" : undefined}>
                {f.kind === "image" ? (
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => (
                      <ImageUploader
                        id={id}
                        value={field.value}
                        onChange={field.onChange}
                        folder={folder}
                        fallbackPreview={f.fallbackImage}
                        onBusyChange={setUploading}
                        aspect={f.name.includes("favicon") || f.name.includes("logo") ? "square" : "wide"}
                      />
                    )}
                  />
                ) : f.kind === "textarea" ? (
                  <Textarea id={id} rows={f.rows ?? 3} {...register(f.name)} aria-invalid={!!err} />
                ) : (
                  <Input id={id} type={f.kind === "email" ? "email" : f.kind === "url" ? "url" : "text"} {...register(f.name)} aria-invalid={!!err} />
                )}
              </Field>
            );
          })}
        </div>
        <SaveBar dirty={formState.isDirty} saving={save.isPending} busy={uploading} onReset={() => reset(defaults)} />
      </form>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Our Story — has a repeatable list of team members.
// ---------------------------------------------------------------------------

const memberSchema = z.object({
  heading: z.string().trim().min(1, "Heading is required").max(200),
  body: z.string().trim().max(4000, "Keep this under 4000 characters"),
  image_url: z.string(),
  image_alt: z.string().trim().max(300),
});
const storySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  subtitle: z.string().trim().max(300),
  intro: z.string().trim().max(2000),
  closing_title: z.string().trim().max(300),
  members: z.array(memberSchema).max(8),
});
type StoryValues = z.infer<typeof storySchema>;

function StoryForm({ values }: { values: SiteSettings["story"] }) {
  const save = useSaveSettingsSection();
  const { register, control, handleSubmit, formState, reset } = useForm<StoryValues>({
    resolver: zodResolver(storySchema),
    defaultValues: values,
  });
  const { fields, append, remove, move } = useFieldArray({ control, name: "members" });
  const [uploading, setUploading] = useState(false);
  useDirtyGuard(formState.isDirty);
  const savedKey = JSON.stringify(values);
  useEffect(() => reset(JSON.parse(savedKey)), [savedKey, reset]);
  const e = formState.errors;

  return (
    <Panel>
      <form
        noValidate
        onSubmit={handleSubmit(async (v) => {
          try {
            await save.mutateAsync({ section: "story", values: v as SiteSettings["story"] });
            toast.success("Our Story saved");
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't save these settings."));
          }
        })}
      >
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Our Story page</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Text and people shown on /our-story.</p>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Field id="st-title" label="Page title" required error={e.title?.message}>
            <Input id="st-title" {...register("title")} />
          </Field>
          <Field id="st-sub" label="Subtitle" error={e.subtitle?.message}>
            <Input id="st-sub" {...register("subtitle")} />
          </Field>
          <Field id="st-intro" label="Intro" className="md:col-span-2" error={e.intro?.message}>
            <Textarea id="st-intro" rows={3} {...register("intro")} />
          </Field>
          <Field id="st-close" label="Closing call-to-action heading" className="md:col-span-2" error={e.closing_title?.message}>
            <Input id="st-close" {...register("closing_title")} />
          </Field>
        </div>

        <div className="space-y-4 border-t p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">People</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fields.length >= 8}
              onClick={() => append({ heading: "", body: "", image_url: "", image_alt: "" })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add person
            </Button>
          </div>
          {fields.length === 0 && <p className="text-sm text-muted-foreground">No people added. The section will be hidden.</p>}
          {fields.map((f, i) => {
            const me = e.members?.[i];
            return (
              <div key={f.id} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Person {i + 1}</span>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move down" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label={`Remove person ${i + 1}`} onClick={() => remove(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[200px,1fr]">
                  <Controller
                    control={control}
                    name={`members.${i}.image_url`}
                    render={({ field }) => (
                      <ImageUploader
                        value={field.value}
                        onChange={field.onChange}
                        folder="settings"
                        aspect="portrait"
                        fallbackPreview={BUILTIN_IMAGES.storyMembers[i]}
                        onBusyChange={setUploading}
                      />
                    )}
                  />
                  <div className="space-y-4">
                    <Field id={`m-h-${i}`} label="Heading" required error={me?.heading?.message}>
                      <Input id={`m-h-${i}`} {...register(`members.${i}.heading`)} placeholder="Hi, I'm Emily" />
                    </Field>
                    <Field id={`m-b-${i}`} label="Text" hint="Leave a blank line between paragraphs." error={me?.body?.message}>
                      <Textarea id={`m-b-${i}`} rows={6} {...register(`members.${i}.body`)} />
                    </Field>
                    <Field id={`m-a-${i}`} label="Photo description (alt text)" hint="Describes the photo for screen readers.">
                      <Input id={`m-a-${i}`} {...register(`members.${i}.image_alt`)} />
                    </Field>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <SaveBar dirty={formState.isDirty} saving={save.isPending} busy={uploading} onReset={() => reset(values)} />
      </form>
    </Panel>
  );
}

// ---------------------------------------------------------------------------

const F = {
  brand: [
    { name: "name", label: "Website name", required: true },
    { name: "tagline", label: "Tagline" },
    { name: "logo_url", label: "Logo", kind: "image", hint: "PNG with a transparent background works best.", fallbackImage: BUILTIN_IMAGES.logo },
    { name: "favicon_url", label: "Browser tab icon (favicon)", kind: "image", hint: "Square PNG, at least 64×64. Leave empty to use the default." },
  ],
  contact: [
    { name: "email", label: "Contact email", kind: "email", required: true },
    { name: "phone", label: "Phone", hint: "Optional. Shown on the Contact page if set." },
    { name: "location", label: "Location" },
    { name: "instagram_handle", label: "Instagram handle", hint: "Without the @" },
    { name: "instagram_url", label: "Instagram link", kind: "url" },
    { name: "linktree_url", label: "Linktree link", kind: "url", hint: "Leave empty to hide the icon." },
  ],
  hero: [
    { name: "headline", label: "Headline", required: true },
    { name: "body", label: "Intro text", kind: "textarea", rows: 4 },
    { name: "note", label: "Small print under the buttons" },
    { name: "primary_cta", label: "Main button label", required: true },
    { name: "secondary_cta", label: "Second button label", required: true },
    { name: "image_url", label: "Hero image", kind: "image", fallbackImage: BUILTIN_IMAGES.hero },
    { name: "image_alt", label: "Hero image description (alt text)" },
  ],
  home: [
    { name: "marquee", label: "Scrolling banner text", kind: "textarea", rows: 2, max: 500 },
    { name: "collections_title", label: "Collections section title" },
    { name: "inquiry_eyebrow", label: "Inquiry form small heading" },
    { name: "inquiry_title", label: "Inquiry form title" },
    { name: "inquiry_body", label: "Inquiry form intro", kind: "textarea" },
    { name: "inquiry_note", label: "Inquiry form footnote" },
  ],
  shop: [
    { name: "title", label: "Shop page title", required: true },
    { name: "subtitle", label: "Shop page subtitle" },
  ],
  contact_page: [
    { name: "title", label: "Contact page title", required: true },
    { name: "intro", label: "Intro", kind: "textarea" },
    { name: "closing_note", label: "Closing note", kind: "textarea" },
  ],
  custom_order: [
    { name: "title", label: "Custom order page title", required: true },
    { name: "intro", label: "Intro", kind: "textarea" },
    { name: "faq_title", label: "FAQ section title" },
  ],
  footer: [
    { name: "tagline", label: "Tagline under the logo" },
    { name: "about", label: "About text", kind: "textarea" },
    { name: "copyright", label: "Copyright line", hint: "{year} is replaced with the current year." },
  ],
  seo: [
    { name: "title", label: "Homepage title (browser tab & search results)", required: true, max: 70, hint: "About 50–60 characters is ideal." },
    { name: "description", label: "Meta description", kind: "textarea", max: 300, hint: "About 150–160 characters is ideal." },
  ],
} satisfies Record<string, FieldDef[]>;

const TABS = [
  { value: "general", label: "General" },
  { value: "home", label: "Homepage" },
  { value: "pages", label: "Pages" },
  { value: "story", label: "Our Story" },
  { value: "footer", label: "Footer & SEO" },
  { value: "data", label: "Data" },
];

export default function SettingsPage() {
  const stored = useStoredSettings();
  const settings = useMemo(() => mergeSettings(stored.data ?? {}), [stored.data]);
  const [tab, setTab] = useState("general");

  return (
    <>
      <PageHeader title="Website Settings" description="Global text, contact details and images used across the website. Each card saves on its own." />
      {stored.error ? (
        <ErrorState message={friendlyError(stored.error)} onRetry={() => void stored.refetch()} />
      ) : stored.isLoading ? (
        <Panel>
          <TableSkeleton rows={5} cols={2} />
        </Panel>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="mb-6">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {/* forceMount keeps unsaved edits when switching tabs */}
          <TabsContent value="general" forceMount className="space-y-6 data-[state=inactive]:hidden">
            <SectionForm section="brand" title="Brand" fields={F.brand} values={settings.brand} />
            <SectionForm section="contact" title="Contact & social" description="Used in the header, footer and Contact page." fields={F.contact} values={settings.contact} />
          </TabsContent>
          <TabsContent value="home" forceMount className="space-y-6 data-[state=inactive]:hidden">
            <SectionForm section="hero" title="Hero" description="The large intro at the top of the homepage." fields={F.hero} values={settings.hero} />
            <SectionForm section="home" title="Homepage sections" fields={F.home} values={settings.home} />
          </TabsContent>
          <TabsContent value="pages" forceMount className="space-y-6 data-[state=inactive]:hidden">
            <SectionForm section="shop" title="Shop page" fields={F.shop} values={settings.shop} />
            <SectionForm section="custom_order" title="Custom Order page" description="FAQs themselves are managed under FAQs." fields={F.custom_order} values={settings.custom_order} />
            <SectionForm section="contact_page" title="Contact page" fields={F.contact_page} values={settings.contact_page} />
          </TabsContent>
          <TabsContent value="story" forceMount className="space-y-6 data-[state=inactive]:hidden">
            <StoryForm values={settings.story} />
          </TabsContent>
          <TabsContent value="footer" forceMount className="space-y-6 data-[state=inactive]:hidden">
            <SectionForm section="footer" title="Footer" fields={F.footer} values={settings.footer} />
            <SectionForm section="seo" title="Search engines (SEO)" fields={F.seo} values={settings.seo} />
          </TabsContent>
          <TabsContent value="data" forceMount className="space-y-6 data-[state=inactive]:hidden">
            <StarterContentImport variant="maintenance" />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
