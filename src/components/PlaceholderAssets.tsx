

const PlaceholderAssets = () => (
  <section className="bg-background py-16 md:py-20 px-6">
    <div className="max-w-5xl mx-auto">
      <h2 className="section-title-italic text-center mb-10">More About Emily</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Placeholder: Emily & her mom photo */}
        <div className="bg-warm-linen rounded-2xl p-8 text-center space-y-3 border-2 border-dashed border-primary/30">
          <div className="w-full aspect-[4/5] bg-primary/5 rounded-xl flex items-center justify-center">
            <p className="font-body text-sm text-muted-foreground italic px-4">
              📸 Photo of Emily & her mom<br />
              <span className="text-xs">(Emily will provide)</span>
            </p>
          </div>
          <p className="font-display text-lg text-foreground">Emily & Her Mom</p>
          <p className="font-body text-sm text-muted-foreground">
            The "Matka" inspiration — where it all started.
          </p>
        </div>

        {/* Placeholder: Business card */}
        <div className="bg-warm-linen rounded-2xl p-8 text-center space-y-3 border-2 border-dashed border-primary/30">
          <div className="w-full aspect-[4/5] bg-primary/5 rounded-xl flex items-center justify-center">
            <p className="font-body text-sm text-muted-foreground italic px-4">
              🪪 Business card design<br />
              <span className="text-xs">(Emily will provide)</span>
            </p>
          </div>
          <p className="font-display text-lg text-foreground">Business Card</p>
          <p className="font-body text-sm text-muted-foreground">
            The Matka & Me Threads brand identity.
          </p>
        </div>

        {/* Placeholder: Linktree */}
        <div className="bg-warm-linen rounded-2xl p-8 text-center space-y-3 border-2 border-dashed border-primary/30">
          <div className="w-full aspect-[4/5] bg-primary/5 rounded-xl flex items-center justify-center">
            <p className="font-body text-sm text-muted-foreground italic px-4">
              🔗 Linktree<br />
              <span className="text-xs">(Emily will provide — optional)</span>
            </p>
          </div>
          <p className="font-display text-lg text-foreground">Linktree</p>
          <p className="font-body text-sm text-muted-foreground">
            Find all of Emily's links in one place.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default PlaceholderAssets;
